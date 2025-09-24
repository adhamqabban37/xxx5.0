import asyncio
import json
import logging
import traceback
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global crawler instance
crawler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the lifecycle of the FastAPI app and crawler."""
    global crawler
    
    try:
        # Import and initialize crawler during startup
        logger.info("Initializing Crawl4AI AsyncWebCrawler...")
        from crawl4ai import AsyncWebCrawler
        
        crawler = AsyncWebCrawler(
            # Use headless mode for production
            headless=True,
            # Disable images for faster crawling
            browser_args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-images"],
            # Set a reasonable timeout
            timeout=30
        )
        
        # Start the crawler session
        await crawler.astart()
        logger.info("Crawl4AI AsyncWebCrawler initialized successfully")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to initialize crawler: {e}")
        logger.error(traceback.format_exc())
        # Create a mock crawler for fallback
        crawler = None
        yield
        
    finally:
        # Cleanup
        if crawler:
            try:
                await crawler.aclose()
                logger.info("Crawl4AI AsyncWebCrawler closed successfully")
            except Exception as e:
                logger.error(f"Error closing crawler: {e}")

# Create FastAPI app with lifecycle management
app = FastAPI(
    title="Crawl4AI Microservice",
    description="Production FastAPI microservice for web crawling using Crawl4AI",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

def extract_headings(html_content: str) -> List[Dict[str, Any]]:
    """Extract headings from HTML content."""
    try:
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(html_content, 'html.parser')
        headings = []
        
        for i in range(1, 7):  # h1 to h6
            for heading in soup.find_all(f'h{i}'):
                headings.append({
                    'level': i,
                    'text': heading.get_text(strip=True),
                    'id': heading.get('id', ''),
                    'classes': heading.get('class', [])
                })
        
        return headings
        
    except Exception as e:
        logger.warning(f"Failed to extract headings: {e}")
        return []

def extract_schema_markup(html_content: str) -> List[Dict[str, Any]]:
    """Extract JSON-LD schema markup from HTML."""
    try:
        from bs4 import BeautifulSoup
        
        soup = BeautifulSoup(html_content, 'html.parser')
        schemas = []
        
        # Find all JSON-LD scripts
        for script in soup.find_all('script', {'type': 'application/ld+json'}):
            try:
                schema_data = json.loads(script.string)
                schemas.append(schema_data)
            except json.JSONDecodeError:
                continue
                
        return schemas
        
    except Exception as e:
        logger.warning(f"Failed to extract schema markup: {e}")
        return []

def create_fallback_response(url: str, error: str) -> Dict[str, Any]:
    """Create a fallback response when crawling fails."""
    return {
        "url": url,
        "markdown": f"# Error Crawling {url}\n\nUnable to crawl this URL: {error}",
        "metadata": {
            "title": f"Error - {url}",
            "description": f"Failed to crawl: {error}",
            "keywords": [],
            "author": "",
            "language": "en",
            "url": url,
            "timestamp": datetime.now().isoformat(),
            "crawl_duration": 0,
            "word_count": 0,
            "status": "error",
            "error": error
        },
        "schema": [],
        "headings": [],
        "success": False,
        "error": error
    }

@app.get("/")
async def root():
    """Health check endpoint."""
    global crawler
    status = "healthy" if crawler else "degraded"
    return {
        "service": "Crawl4AI Microservice",
        "version": "1.0.0",
        "status": status,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    global crawler
    
    return {
        "status": "healthy" if crawler else "degraded",
        "crawler_initialized": crawler is not None,
        "timestamp": datetime.now().isoformat(),
        "service": "crawl4ai-microservice"
    }

@app.get("/crawl")
async def crawl_url(url: str = Query(..., description="URL to crawl")):
    """
    Crawl a URL and return structured content.
    
    Returns:
    - markdown: Extracted text content in markdown format
    - metadata: Page metadata (title, description, etc.)
    - schema: JSON-LD schema markup found on the page
    - headings: Structured heading hierarchy
    - success: Boolean indicating if crawling was successful
    """
    global crawler
    
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter is required")
    
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    
    logger.info(f"Crawling URL: {url}")
    
    # Check if crawler is available
    if not crawler:
        logger.error("Crawler not initialized - returning fallback response")
        return create_fallback_response(url, "Crawler service not available")
    
    try:
        start_time = datetime.now()
        
        # Perform the crawl
        result = await crawler.arun(url=url)
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Extract content
        markdown_content = result.markdown or ""
        html_content = result.html or ""
        
        # Extract headings and schema
        headings = extract_headings(html_content)
        schema_markup = extract_schema_markup(html_content)
        
        # Calculate word count
        word_count = len(markdown_content.split()) if markdown_content else 0
        
        # Build metadata
        metadata = {
            "title": result.metadata.get("title", "") if result.metadata else "",
            "description": result.metadata.get("description", "") if result.metadata else "",
            "keywords": result.metadata.get("keywords", []) if result.metadata else [],
            "author": result.metadata.get("author", "") if result.metadata else "",
            "language": result.metadata.get("language", "en") if result.metadata else "en",
            "url": url,
            "timestamp": end_time.isoformat(),
            "crawl_duration": round(duration, 2),
            "word_count": word_count,
            "status": "success"
        }
        
        response_data = {
            "url": url,
            "markdown": markdown_content,
            "metadata": metadata,
            "schema": schema_markup,
            "headings": headings,
            "success": True
        }
        
        logger.info(f"Successfully crawled {url} in {duration:.2f}s - {word_count} words")
        return response_data
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error crawling {url}: {error_msg}")
        logger.error(traceback.format_exc())
        
        # Return structured error response
        return create_fallback_response(url, error_msg)

@app.post("/crawl")
async def crawl_url_post(request: Dict[str, Any]):
    """POST version of crawl endpoint for more complex requests."""
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required in request body")
    
    # For now, just redirect to the GET version
    return await crawl_url(url)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Global exception: {exc}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": "Internal server error",
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    # Run the service
    logger.info("Starting Crawl4AI Microservice on port 8001...")
    uvicorn.run(
        "crawl4ai-service:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable reload in production
        log_level="info"
    )