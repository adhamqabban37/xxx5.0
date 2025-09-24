from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from typing import List, Dict, Any, Tuple
import logging
import asyncio
from functools import lru_cache
import time
from collections import defaultdict
import threading
from concurrent.futures import ThreadPoolExecutor
import os

logger = logging.getLogger(__name__)

class RateLimiter:
    """Simple rate limiter for API calls"""
    
    def __init__(self, max_calls: int = 100, window: int = 3600):
        self.max_calls = max_calls
        self.window = window
        self.calls = defaultdict(list)
        self.lock = threading.Lock()
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if a call is allowed for the given identifier"""
        with self.lock:
            now = time.time()
            # Clean old calls
            self.calls[identifier] = [
                call_time for call_time in self.calls[identifier]
                if now - call_time < self.window
            ]
            
            if len(self.calls[identifier]) >= self.max_calls:
                return False
            
            self.calls[identifier].append(now)
            return True

class SemanticAnalysisService:
    """Service for semantic analysis using sentence-transformers with production optimizations"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self._loading = False
        self.rate_limiter = RateLimiter(
            max_calls=int(os.getenv('SEMANTIC_MAX_CALLS', 1000)),
            window=int(os.getenv('SEMANTIC_WINDOW', 3600))
        )
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._cache = {}
    
    async def initialize(self, retry_count: int = 3):
        """Initialize the sentence transformer model with error handling and retries"""
        if self.model is not None:
            return
        
        if self._loading:
            # Wait for initialization to complete
            while self._loading:
                await asyncio.sleep(0.1)
            return
        
        self._loading = True
        
        try:
            last_error = None
            
            for attempt in range(retry_count):
                try:
                    logger.info(f"Loading sentence transformer model: {self.model_name} (attempt {attempt + 1})")
                    
                    # Load model in a thread to avoid blocking
                    loop = asyncio.get_event_loop()
                    self.model = await loop.run_in_executor(
                        None, 
                        SentenceTransformer, 
                        self.model_name
                    )
                    logger.info("Sentence transformer model loaded successfully")
                    break  # Success, exit retry loop
                    
                except Exception as e:
                    last_error = e
                    logger.warning(f"Attempt {attempt + 1} failed: {e}")
                    if attempt < retry_count - 1:
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
            else:
                # All retries failed
                logger.error(f"Failed to load sentence transformer model after {retry_count} attempts: {last_error}")
                raise last_error
        
        finally:
            self._loading = False
    
    async def encode_texts(self, texts: List[str], use_cache: bool = True, client_id: str = "default") -> np.ndarray:
        """Encode texts into embeddings with rate limiting and caching"""
        # Check rate limit
        if not self.rate_limiter.is_allowed(client_id):
            logger.warning(f"Rate limit exceeded for client: {client_id}")
            raise Exception("Rate limit exceeded. Please try again later.")
        
        await self.initialize()
        
        if not texts:
            return np.array([])
        
        # Clean and filter texts
        cleaned_texts = []
        for text in texts:
            if isinstance(text, str) and len(text.strip()) > 0:
                cleaned_texts.append(text.strip()[:1000])  # Limit text length
        
        if not cleaned_texts:
            return np.array([])
        
        # Check cache if enabled
        if use_cache:
            cache_key = hash(tuple(cleaned_texts))
            if cache_key in self._cache:
                logger.debug(f"Cache hit for {len(cleaned_texts)} texts")
                return self._cache[cache_key]
        
        try:
            logger.info(f"Encoding {len(cleaned_texts)} texts")
            start_time = time.time()
            
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                self.executor,
                self.model.encode,
                cleaned_texts
            )
            
            # Cache the result if enabled
            if use_cache:
                self._cache[cache_key] = embeddings
                # Keep cache size manageable
                if len(self._cache) > 1000:
                    # Remove oldest entries (simple FIFO)
                    oldest_keys = list(self._cache.keys())[:100]
                    for key in oldest_keys:
                        del self._cache[key]
            
            elapsed_time = time.time() - start_time
            logger.info(f"Successfully encoded {len(cleaned_texts)} texts in {elapsed_time:.2f}s")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to encode texts: {e}")
            raise Exception(f"Embedding generation failed: {str(e)}")
    
    def calculate_similarity(self, query_embeddings: np.ndarray, content_embeddings: np.ndarray) -> np.ndarray:
        """Calculate cosine similarity between query and content embeddings"""
        if query_embeddings.size == 0 or content_embeddings.size == 0:
            return np.array([])
        
        return cosine_similarity(query_embeddings, content_embeddings)
    
    async def analyze_content_relevance(
        self, 
        queries: List[str], 
        content_chunks: List[Dict[str, Any]],
        client_id: str = "default"
    ) -> Dict[str, Any]:
        """
        Analyze how well content answers user queries using semantic similarity
        
        Args:
            queries: List of user queries/questions
            content_chunks: List of content chunks with 'text' and 'type' fields
        
        Returns:
            Analysis results with scores and recommendations
        """
        if not queries or not content_chunks:
            return {
                "overall_score": 0.0,
                "query_analysis": [],
                "content_coverage": 0.0,
                "recommendations": []
            }
        
        # Extract content texts
        content_texts = []
        content_metadata = []
        
        for chunk in content_chunks:
            if isinstance(chunk, dict) and 'text' in chunk:
                text = chunk['text']
                if isinstance(text, str) and len(text.strip()) > 10:  # Minimum length filter
                    content_texts.append(text.strip())
                    content_metadata.append({
                        'type': chunk.get('type', 'content'),
                        'original_text': text[:200] + '...' if len(text) > 200 else text,
                        'length': len(text)
                    })
        
        if not content_texts:
            return {
                "overall_score": 0.0,
                "query_analysis": [],
                "content_coverage": 0.0,
                "recommendations": ["No meaningful content found for analysis"]
            }
        
        try:
            # Encode queries and content
            logger.info(f"Encoding {len(queries)} queries and {len(content_texts)} content chunks")
            
            query_embeddings = await self.encode_texts(queries, client_id=client_id)
            content_embeddings = await self.encode_texts(content_texts, client_id=client_id)
            
            if query_embeddings.size == 0 or content_embeddings.size == 0:
                return {
                    "overall_score": 0.0,
                    "query_analysis": [],
                    "content_coverage": 0.0,
                    "recommendations": ["Failed to generate embeddings"]
                }
            
            # Calculate similarities
            similarity_matrix = self.calculate_similarity(query_embeddings, content_embeddings)
            
            # Analyze each query
            query_analysis = []
            total_score = 0.0
            
            for i, query in enumerate(queries):
                query_similarities = similarity_matrix[i]
                max_similarity = np.max(query_similarities)
                best_match_idx = np.argmax(query_similarities)
                
                # Find top 3 matches
                top_indices = np.argsort(query_similarities)[-3:][::-1]
                top_matches = []
                
                for idx in top_indices:
                    if query_similarities[idx] > 0.1:  # Minimum similarity threshold
                        top_matches.append({
                            "content": content_metadata[idx]['original_text'],
                            "score": float(query_similarities[idx]),
                            "type": content_metadata[idx]['type']
                        })
                
                # Determine if query is well answered
                is_answered = max_similarity > 0.4  # Similarity threshold for "answered"
                confidence = min(max_similarity * 2, 1.0)  # Scale to 0-1
                
                query_analysis.append({
                    "query": query,
                    "is_answered": is_answered,
                    "confidence": confidence,
                    "max_similarity": float(max_similarity),
                    "best_match": content_metadata[best_match_idx]['original_text'] if len(content_metadata) > best_match_idx else "",
                    "top_matches": top_matches
                })
                
                total_score += confidence
            
            # Calculate overall metrics
            overall_score = (total_score / len(queries)) * 100
            answered_count = sum(1 for qa in query_analysis if qa['is_answered'])
            content_coverage = (answered_count / len(queries)) * 100
            
            # Generate recommendations
            recommendations = self._generate_recommendations(query_analysis, content_coverage)
            
            return {
                "overall_score": round(overall_score, 2),
                "query_analysis": query_analysis,
                "content_coverage": round(content_coverage, 2),
                "queries_answered": answered_count,
                "total_queries": len(queries),
                "recommendations": recommendations,
                "analysis_metadata": {
                    "queries_processed": len(queries),
                    "content_chunks_analyzed": len(content_texts),
                    "model_used": self.model_name
                }
            }
            
        except Exception as e:
            logger.error(f"Semantic analysis failed: {e}")
            return {
                "overall_score": 0.0,
                "query_analysis": [],
                "content_coverage": 0.0,
                "recommendations": [f"Analysis failed: {str(e)}"],
                "error": str(e)
            }
    
    def _generate_recommendations(self, query_analysis: List[Dict], content_coverage: float) -> List[str]:
        """Generate actionable recommendations based on analysis"""
        recommendations = []
        
        unanswered_queries = [qa for qa in query_analysis if not qa['is_answered']]
        low_confidence_queries = [qa for qa in query_analysis if qa['is_answered'] and qa['confidence'] < 0.6]
        
        if content_coverage < 50:
            recommendations.append(
                f"Low content coverage ({content_coverage:.1f}%). Add more comprehensive content addressing user questions."
            )
        
        if len(unanswered_queries) > 0:
            recommendations.append(
                f"{len(unanswered_queries)} queries have no relevant content. "
                f"Consider adding FAQ sections or detailed explanations for: "
                f"{', '.join([q['query'][:50] for q in unanswered_queries[:3]])}"
            )
        
        if len(low_confidence_queries) > 0:
            recommendations.append(
                f"{len(low_confidence_queries)} queries have weak matches. "
                f"Improve content clarity and directness for better answer engine optimization."
            )
        
        if content_coverage >= 80:
            recommendations.append("Excellent content coverage! Consider adding FAQ schema markup for better AEO performance.")
        elif content_coverage >= 60:
            recommendations.append("Good content coverage. Focus on improving answer clarity and adding structured data.")
        
        return recommendations

# Global instance
semantic_service = SemanticAnalysisService()