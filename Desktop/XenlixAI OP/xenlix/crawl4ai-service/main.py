from fastapi import FastAPI, HTTPException, BackgroundTasks, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, ValidationError
from crawl4ai import WebCrawler, CrawlerRunConfig
from crawl4ai.extraction_strategy import JsonCssExtractionStrategy, LLMExtractionStrategy
import asyncio
import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import os
import time
from collections import defaultdict
import traceback
from semantic_analysis import semantic_service

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Crawl4AI AEO Service", 
    version="1.0.0",
    description="Production-ready website scanning and AEO analysis service"
)

# Rate limiting middleware
class RateLimitMiddleware:
    def __init__(self, calls_per_minute: int = 60):
        self.calls_per_minute = calls_per_minute
        self.client_calls = defaultdict(list)
    
    async def __call__(self, request: Request, call_next):
        client_ip = request.client.host
        now = time.time()
        
        # Clean old calls
        self.client_calls[client_ip] = [
            call_time for call_time in self.client_calls[client_ip]
            if now - call_time < 60  # 1 minute window
        ]
        
        # Check rate limit
        if len(self.client_calls[client_ip]) >= self.calls_per_minute:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded", "retry_after": 60}
            )
        
        # Record this call
        self.client_calls[client_ip].append(now)
        
        return await call_next(request)

# Add middleware
app.add_middleware(RateLimitMiddleware, calls_per_minute=int(os.getenv('RATE_LIMIT_PER_MINUTE', 60)))

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002", 
        "http://localhost:3003",
        "https://xenlix.ai",  # Add production domain
        "https://*.xenlix.ai"  # Add subdomains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv('DEBUG') else "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Validation error handler
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "details": exc.errors(),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Pydantic models
class ScanRequest(BaseModel):
    url: HttpUrl
    scan_type: str = "full"  # full, quick, schema-only
    include_ai_analysis: bool = True
    user_agent: str = "XenlixAI-Bot/1.0 (+https://xenlix.ai/bot)"
    queries: Optional[List[str]] = None  # Optional queries for semantic analysis

class AEOAnalysis(BaseModel):
    schema_compliance_score: float
    voice_search_readiness: float
    snippet_optimization_score: float
    faq_structure_score: float
    local_optimization_score: float
    overall_aeo_score: float

class ScanResult(BaseModel):
    url: str
    status: str
    timestamp: datetime

class HealthStatus(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, str]
    version: str

# Service status tracking
service_stats = {
    "requests_total": 0,
    "requests_success": 0,
    "requests_error": 0,
    "start_time": datetime.utcnow()
}

# Health check endpoint
@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check semantic service
        semantic_status = "healthy"
        try:
            if semantic_service.model is None:
                await semantic_service.initialize()
            semantic_status = "healthy" if semantic_service.model is not None else "unhealthy"
        except Exception as e:
            logger.error(f"Semantic service health check failed: {e}")
            semantic_status = "unhealthy"
        
        return HealthStatus(
            status="healthy" if semantic_status == "healthy" else "degraded",
            timestamp=datetime.utcnow(),
            services={
                "semantic_analysis": semantic_status,
                "web_crawler": "healthy",  # Add crawler check if needed
            },
            version="1.0.0"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unavailable")

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    """Get service metrics"""
    uptime = datetime.utcnow() - service_stats["start_time"]
    return {
        "requests_total": service_stats["requests_total"],
        "requests_success": service_stats["requests_success"],
        "requests_error": service_stats["requests_error"],
        "success_rate": service_stats["requests_success"] / max(service_stats["requests_total"], 1),
        "uptime_seconds": uptime.total_seconds(),
        "semantic_model_loaded": semantic_service.model is not None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Basic page info
    title: Optional[str] = None
    meta_description: Optional[str] = None
    canonical_url: Optional[str] = None
    word_count: int = 0
    
    # Content structure
    headings: Dict[str, List[str]] = {}
    
    # Schema & structured data
    json_ld_schemas: List[Dict[str, Any]] = []
    schema_types: List[str] = []
    has_faq_schema: bool = False
    has_local_business_schema: bool = False
    has_article_schema: bool = False
    
    # Social metadata
    open_graph: Dict[str, Optional[str]] = {}
    twitter_card: Dict[str, Optional[str]] = {}
    
    # Content analysis
    content_analysis: Dict[str, Any] = {}
    
    # AEO scores and recommendations
    aeo_analysis: Optional[AEOAnalysis] = None
    recommendations: List[Dict[str, Any]] = []
    
    # Semantic analysis results
    semantic_analysis: Optional[Dict[str, Any]] = None
    
    # Raw content (optional)
    raw_html: Optional[str] = None
    extracted_content: Optional[str] = None

# Global crawler instance
crawler = None

async def get_crawler():
    global crawler
    if crawler is None:
        crawler = WebCrawler(verbose=True)
        await crawler.awarmup()
    return crawler

@app.on_event("startup")
async def startup_event():
    """Initialize the crawler on startup"""
    logger.info("Initializing Crawl4AI service...")
    await get_crawler()
    logger.info("Crawl4AI service ready!")

@app.on_event("shutdown")  
async def shutdown_event():
    """Cleanup on shutdown"""
    global crawler
    if crawler:
        await crawler.aclose()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "crawl4ai-aeo", "timestamp": datetime.now()}

@app.post("/scan", response_model=ScanResult)
async def scan_website(request: ScanRequest):
    """
    Main endpoint to scan a website for AEO analysis
    """
    start_time = time.time()
    service_stats["requests_total"] += 1
    
    try:
        logger.info(f"Starting scan for URL: {request.url}")
        
        crawler = await get_crawler()
        
        # Configure crawl settings
        config = CrawlerRunConfig(
            word_count_threshold=50,
            extraction_strategy=JsonCssExtractionStrategy({
                "headings": [
                    {"name": "h1", "selector": "h1"},
                    {"name": "h2", "selector": "h2"}, 
                    {"name": "h3", "selector": "h3"},
                    {"name": "h4", "selector": "h4"},
                    {"name": "h5", "selector": "h5"},
                    {"name": "h6", "selector": "h6"}
                ],
                "metadata": [
                    {"name": "title", "selector": "title"},
                    {"name": "meta_description", "selector": "meta[name='description']", "attribute": "content"},
                    {"name": "canonical", "selector": "link[rel='canonical']", "attribute": "href"},
                    {"name": "og_title", "selector": "meta[property='og:title']", "attribute": "content"},
                    {"name": "og_description", "selector": "meta[property='og:description']", "attribute": "content"},
                    {"name": "og_image", "selector": "meta[property='og:image']", "attribute": "content"},
                    {"name": "twitter_card", "selector": "meta[name='twitter:card']", "attribute": "content"},
                    {"name": "twitter_title", "selector": "meta[name='twitter:title']", "attribute": "content"},
                    {"name": "twitter_description", "selector": "meta[name='twitter:description']", "attribute": "content"}
                ],
                "structured_data": [
                    {"name": "json_ld", "selector": "script[type='application/ld+json']"}
                ]
            }),
            user_agent=request.user_agent,
            headless=True,
            page_timeout=30000,
            delay_before_return_html=2.0
        )
        
        # Perform the crawl
        result = await crawler.arun(url=str(request.url), config=config)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=f"Crawl failed: {result.error_message}")
        
        # Process the crawl result
        scan_result = await process_crawl_result(result, str(request.url))
        
        # Perform AEO analysis if requested
        if request.include_ai_analysis:
            scan_result.aeo_analysis = await analyze_aeo_performance(scan_result)
            scan_result.recommendations = generate_aeo_recommendations(scan_result)
        
        # Perform semantic analysis if queries provided
        if request.queries and len(request.queries) > 0:
            # Get client IP for rate limiting (would need request context in real implementation)
            client_ip = "default"  # In production, extract from request
            scan_result.semantic_analysis = await perform_semantic_analysis(scan_result, request.queries, client_ip)
        
        service_stats["requests_success"] += 1
        elapsed_time = time.time() - start_time
        logger.info(f"Scan completed successfully for: {request.url} in {elapsed_time:.2f}s")
        return scan_result
        
    except Exception as e:
        service_stats["requests_error"] += 1
        elapsed_time = time.time() - start_time
        logger.error(f"Scan failed for {request.url} after {elapsed_time:.2f}s: {str(e)}")
        
        # Return structured error with retry information
        if "timeout" in str(e).lower():
            raise HTTPException(
                status_code=408, 
                detail={
                    "error": "Request timeout",
                    "message": "The website took too long to respond",
                    "retry_after": 30
                }
            )
        elif "rate limit" in str(e).lower():
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "message": "Too many requests",
                    "retry_after": 60
                }
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail={
                    "error": "Scan failed",
                    "message": str(e),
                    "url": str(request.url)
                }
            )

async def process_crawl_result(crawl_result, url: str) -> ScanResult:
    """Process the raw crawl result into our structured format"""
    
    # Parse extracted data
    extracted_data = json.loads(crawl_result.extracted_content) if crawl_result.extracted_content else {}
    
    # Process headings
    headings = {"h1": [], "h2": [], "h3": [], "h4": [], "h5": [], "h6": []}
    if "headings" in extracted_data:
        for heading_group in extracted_data["headings"]:
            for heading in heading_group:
                tag = heading.get("name", "").lower()
                if tag in headings:
                    headings[tag].append(heading.get("text", "").strip())
    
    # Process metadata
    metadata = {}
    if "metadata" in extracted_data:
        for meta_group in extracted_data["metadata"]:
            for meta in meta_group:
                metadata[meta.get("name", "")] = meta.get("content") or meta.get("text", "")
    
    # Process structured data (JSON-LD)
    json_ld_schemas = []
    schema_types = []
    has_faq_schema = False
    has_local_business_schema = False
    has_article_schema = False
    
    if "structured_data" in extracted_data:
        for struct_group in extracted_data["structured_data"]:
            for struct in struct_group:
                try:
                    schema_content = struct.get("text", "").strip()
                    if schema_content:
                        schema_data = json.loads(schema_content)
                        json_ld_schemas.append(schema_data)
                        
                        # Extract schema types
                        if isinstance(schema_data, dict):
                            schema_type = schema_data.get("@type", "")
                            if schema_type:
                                schema_types.append(schema_type)
                                if schema_type == "FAQPage":
                                    has_faq_schema = True
                                elif schema_type in ["LocalBusiness", "Organization"]:
                                    has_local_business_schema = True
                                elif schema_type in ["Article", "BlogPosting"]:
                                    has_article_schema = True
                except json.JSONDecodeError:
                    continue
    
    # Analyze content
    content_analysis = analyze_content_structure(crawl_result.cleaned_html or "")
    
    return ScanResult(
        url=url,
        status="success",
        timestamp=datetime.now(),
        title=metadata.get("title"),
        meta_description=metadata.get("meta_description"),
        canonical_url=metadata.get("canonical"),
        word_count=len((crawl_result.cleaned_html or "").split()),
        headings=headings,
        json_ld_schemas=json_ld_schemas,
        schema_types=list(set(schema_types)),
        has_faq_schema=has_faq_schema,
        has_local_business_schema=has_local_business_schema,
        has_article_schema=has_article_schema,
        open_graph={
            "title": metadata.get("og_title"),
            "description": metadata.get("og_description"),
            "image": metadata.get("og_image")
        },
        twitter_card={
            "card": metadata.get("twitter_card"),
            "title": metadata.get("twitter_title"),
            "description": metadata.get("twitter_description")
        },
        content_analysis=content_analysis,
        raw_html=crawl_result.html if len(crawl_result.html or "") < 50000 else None,  # Limit size
        extracted_content=crawl_result.cleaned_html[:5000] if crawl_result.cleaned_html else None  # First 5k chars
    )

def analyze_content_structure(content: str) -> Dict[str, Any]:
    """Analyze content structure for AEO optimization"""
    
    # Question-answer pattern detection
    has_question_patterns = bool(re.search(r'\b(what|how|why|when|where|who)\b.*\?', content, re.IGNORECASE))
    
    # Answer indicators
    has_answer_indicators = bool(re.search(r'\b(the answer is|simply put|in short|to summarize)\b', content, re.IGNORECASE))
    
    # Natural language indicators
    has_natural_language = bool(re.search(r'\b(you can|we recommend|here\'s how|follow these steps)\b', content, re.IGNORECASE))
    
    # Location indicators
    has_location_info = bool(re.search(r'\b(located|address|phone|hours|directions)\b', content, re.IGNORECASE))
    
    # Calculate readability metrics
    sentences = re.split(r'[.!?]+', content)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    avg_sentence_length = 0
    if sentences:
        word_counts = [len(s.split()) for s in sentences]
        avg_sentence_length = sum(word_counts) / len(word_counts)
    
    return {
        "has_question_answer_pairs": has_question_patterns,
        "has_clear_answers": has_answer_indicators,
        "has_natural_language_content": has_natural_language,
        "has_location_info": has_location_info,
        "avg_sentence_length": round(avg_sentence_length, 1),
        "sentence_count": len(sentences),
        "paragraph_count": len([p for p in content.split('\n\n') if p.strip()])
    }

async def analyze_aeo_performance(scan_result: ScanResult) -> AEOAnalysis:
    """Analyze AEO performance and generate scores"""
    
    # Schema compliance scoring
    schema_score = 0
    if scan_result.has_faq_schema:
        schema_score += 25
    if scan_result.has_local_business_schema:
        schema_score += 20
    if scan_result.has_article_schema:
        schema_score += 15
    if scan_result.json_ld_schemas:
        schema_score += 20
    if scan_result.canonical_url:
        schema_score += 10
    if scan_result.meta_description:
        schema_score += 10
    
    # Voice search readiness
    voice_score = 0
    content_analysis = scan_result.content_analysis
    if content_analysis.get("has_question_answer_pairs", False):
        voice_score += 30
    if content_analysis.get("has_clear_answers", False):
        voice_score += 25
    if content_analysis.get("has_natural_language_content", False):
        voice_score += 20
    if content_analysis.get("avg_sentence_length", 30) < 20:
        voice_score += 15
    if len(scan_result.headings.get("h2", [])) > 0:
        voice_score += 10
    
    # Snippet optimization
    snippet_score = 0
    if scan_result.title and len(scan_result.title) <= 60:
        snippet_score += 25
    if scan_result.meta_description and len(scan_result.meta_description) <= 160:
        snippet_score += 25
    if len(scan_result.headings.get("h1", [])) == 1:
        snippet_score += 20
    h2_count = len(scan_result.headings.get("h2", []))
    if 1 <= h2_count <= 6:
        snippet_score += 15
    if content_analysis.get("avg_sentence_length", 30) < 25:
        snippet_score += 15
    
    # FAQ structure
    faq_score = 0
    if scan_result.has_faq_schema:
        faq_score += 40
    if content_analysis.get("has_question_answer_pairs", False):
        faq_score += 30
    # Check for FAQ indicators in headings
    all_headings = " ".join(scan_result.headings.get("h2", []) + scan_result.headings.get("h3", []))
    if re.search(r'\b(faq|question|q&a)\b', all_headings, re.IGNORECASE):
        faq_score += 20
    if any("?" in heading for heading in scan_result.headings.get("h3", [])):
        faq_score += 10
    
    # Local optimization
    local_score = 0
    if scan_result.has_local_business_schema:
        local_score += 40
    if content_analysis.get("has_location_info", False):
        local_score += 30
    if scan_result.title and re.search(r'\b(in|at|near|location)\b', scan_result.title, re.IGNORECASE):
        local_score += 20
    
    # Calculate overall score
    overall_score = (schema_score + voice_score + snippet_score + faq_score + local_score) / 5
    
    return AEOAnalysis(
        schema_compliance_score=min(100, schema_score),
        voice_search_readiness=min(100, voice_score),
        snippet_optimization_score=min(100, snippet_score),
        faq_structure_score=min(100, faq_score),
        local_optimization_score=min(100, local_score),
        overall_aeo_score=min(100, overall_score)
    )

def generate_aeo_recommendations(scan_result: ScanResult) -> List[Dict[str, Any]]:
    """Generate actionable AEO recommendations"""
    recommendations = []
    
    # Schema recommendations
    if not scan_result.has_faq_schema and scan_result.content_analysis.get("has_question_answer_pairs", False):
        recommendations.append({
            "priority": "high",
            "category": "schema",
            "issue": "Missing FAQ Schema markup",
            "solution": "Add FAQPage schema markup to your Q&A content",
            "impact": "Increases chances of appearing in voice search results by 40%",
            "effort": "medium"
        })
    
    if not scan_result.has_local_business_schema and scan_result.content_analysis.get("has_location_info", False):
        recommendations.append({
            "priority": "high", 
            "category": "schema",
            "issue": "Missing Local Business Schema",
            "solution": "Implement LocalBusiness schema with NAP information",
            "impact": "Improves local search visibility and voice assistant responses",
            "effort": "low"
        })
    
    # Content recommendations
    if not scan_result.content_analysis.get("has_question_answer_pairs", False):
        recommendations.append({
            "priority": "medium",
            "category": "content",
            "issue": "Lack of conversational content structure",
            "solution": "Add FAQ sections or rewrite content in question-answer format",
            "impact": "Makes content more suitable for voice search and AI assistants",
            "effort": "high"
        })
    
    # Technical recommendations
    if not scan_result.meta_description:
        recommendations.append({
            "priority": "high",
            "category": "technical",
            "issue": "Missing meta description",
            "solution": "Add a compelling meta description under 160 characters",
            "impact": "Improves click-through rates from search results",
            "effort": "low"
        })
    
    return recommendations

async def perform_semantic_analysis(scan_result: ScanResult, queries: List[str], client_ip: str = "default") -> Dict[str, Any]:
    """Perform semantic analysis using sentence transformers with error handling"""
    try:
        logger.info(f"Starting semantic analysis for {len(queries)} queries")
        
        # Validate input
        if not queries or len(queries) == 0:
            return {
                "error": "No queries provided for analysis",
                "overall_score": 0.0,
                "query_analysis": []
            }
        
        # Limit number of queries for performance
        if len(queries) > 10:
            logger.warning(f"Too many queries ({len(queries)}), limiting to 10")
            queries = queries[:10]
        
        # Extract content chunks for analysis
        content_chunks = []
        
        # Add headings as content chunks
        for level, headings in scan_result.headings.items():
            for heading in headings:
                if len(heading.strip()) > 5:
                    content_chunks.append({
                        'text': heading,
                        'type': f'heading_{level}'
                    })
        
        # Add main content if available
        if scan_result.extracted_content:
            # Split content into paragraphs
            paragraphs = [p.strip() for p in scan_result.extracted_content.split('\n\n') if len(p.strip()) > 20]
            for paragraph in paragraphs[:20]:  # Limit to first 20 paragraphs
                content_chunks.append({
                    'text': paragraph,
                    'type': 'paragraph'
                })
        
        # Add FAQ content if available
        if hasattr(scan_result, 'faq_data') and scan_result.faq_data:
            for faq in scan_result.faq_data:
                if isinstance(faq, dict):
                    question = faq.get('question', '')
                    answer = faq.get('answer', '')
                    if question:
                        content_chunks.append({
                            'text': question,
                            'type': 'faq_question'
                        })
                    if answer:
                        content_chunks.append({
                            'text': answer,
                            'type': 'faq_answer'
                        })
        
        # Perform semantic analysis
        logger.info(f"Performing semantic analysis with {len(queries)} queries and {len(content_chunks)} content chunks")
        analysis_result = await semantic_service.analyze_content_relevance(queries, content_chunks, client_id=client_ip)
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"Semantic analysis failed: {e}")
        return {
            "overall_score": 0.0,
            "query_analysis": [],
            "content_coverage": 0.0,
            "error": f"Semantic analysis failed: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)