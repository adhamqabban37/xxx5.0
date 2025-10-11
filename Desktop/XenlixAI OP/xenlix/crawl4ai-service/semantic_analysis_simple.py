import re
from typing import List, Dict, Any

class SemanticAnalysisService:
    def __init__(self):
        # Lightweight semantic analysis without heavy dependencies
        self.aeo_patterns = [
            r'\b(?:what|how|why|when|where|who)\b',
            r'\b(?:best|top|guide|tutorial|tips)\b',
            r'\b(?:compare|versus|review|benefits)\b'
        ]
    
    def analyze_content_semantics(self, content: str) -> Dict[str, Any]:
        """Analyze content for semantic patterns and AEO relevance"""
        try:
            analysis = {
                "semantic_score": self._calculate_semantic_score(content),
                "content_length": len(content),
                "readability_score": self._calculate_readability(content),
                "keyword_density": self._calculate_keyword_density(content),
                "aeo_relevance": self._assess_aeo_relevance(content),
                "question_patterns": self._find_question_patterns(content),
                "answer_indicators": self._find_answer_indicators(content)
            }
            
            return analysis
            
        except Exception as e:
            return {
                "error": str(e),
                "semantic_score": 0.0,
                "content_length": len(content),
                "readability_score": 0.5,
                "keyword_density": {},
                "aeo_relevance": 0.0,
                "question_patterns": [],
                "answer_indicators": []
            }
    
    def _calculate_semantic_score(self, content: str) -> float:
        """Calculate basic semantic richness score"""
        if not content:
            return 0.0
            
        words = content.split()
        unique_words = set(word.lower() for word in words)
        
        # Basic semantic indicators
        semantic_indicators = [
            len(unique_words) / max(len(words), 1),  # Vocabulary diversity
            min(1.0, len([w for w in words if len(w) > 5]) / max(len(words), 1) * 2),  # Complex words
            min(1.0, content.count('?') / max(len(content), 1) * 100),  # Question density
        ]
        
        return sum(semantic_indicators) / len(semantic_indicators)
    
    def _calculate_readability(self, content: str) -> float:
        """Simple readability calculation"""
        if not content:
            return 0.0
            
        words = content.split()
        sentences = max(1, content.count('.') + content.count('!') + content.count('?'))
        
        avg_words = len(words) / sentences
        # Optimal range: 15-20 words per sentence
        if 15 <= avg_words <= 20:
            return 1.0
        elif avg_words < 15:
            return 0.7 + (avg_words / 15) * 0.3
        else:
            return max(0.1, 1.0 - (avg_words - 20) / 30)
    
    def _calculate_keyword_density(self, content: str) -> Dict[str, float]:
        """Calculate basic keyword density"""
        if not content:
            return {}
            
        words = re.findall(r'\b\w{4,}\b', content.lower())
        total_words = len(words)
        
        if total_words == 0:
            return {}
        
        word_count = {}
        for word in words:
            word_count[word] = word_count.get(word, 0) + 1
        
        # Return top 10 words with their density
        sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)[:10]
        return {word: count / total_words for word, count in sorted_words}
    
    def _assess_aeo_relevance(self, content: str) -> float:
        """Assess AEO (Answer Engine Optimization) relevance"""
        if not content:
            return 0.0
            
        content_lower = content.lower()
        total_score = 0.0
        
        # Question words (higher weight)
        question_words = ['what', 'how', 'why', 'when', 'where', 'who']
        question_score = sum(1 for word in question_words if word in content_lower) * 0.3
        
        # Intent words
        intent_words = ['best', 'top', 'guide', 'tutorial', 'tips', 'benefits']
        intent_score = sum(1 for word in intent_words if word in content_lower) * 0.2
        
        # Comparison words
        comparison_words = ['compare', 'versus', 'vs', 'review', 'difference']
        comparison_score = sum(1 for word in comparison_words if word in content_lower) * 0.2
        
        # Structure indicators
        structure_score = 0.0
        if '?' in content:
            structure_score += 0.2
        if any(word in content_lower for word in ['step', 'first', 'next', 'then']):
            structure_score += 0.1
        
        total_score = question_score + intent_score + comparison_score + structure_score
        return min(1.0, total_score)
    
    def _find_question_patterns(self, content: str) -> List[str]:
        """Find question patterns in content"""
        questions = re.findall(r'[^.!?]*\?[^.!?]*', content)
        return [q.strip() for q in questions[:5]]  # Return top 5
    
    def _find_answer_indicators(self, content: str) -> List[str]:
        """Find patterns that indicate answers"""
        patterns = [
            r'the answer is[^.!?]*',
            r'according to[^.!?]*',
            r'research shows[^.!?]*',
            r'studies indicate[^.!?]*',
            r'experts recommend[^.!?]*'
        ]
        
        indicators = []
        for pattern in patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            indicators.extend(matches[:2])  # Limit per pattern
        
        return indicators[:5]  # Return top 5

# Global instance
semantic_service = SemanticAnalysisService()