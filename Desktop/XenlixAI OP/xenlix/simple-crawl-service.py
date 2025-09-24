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
import requests
from bs4 import BeautifulSoup
import aiohttp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the lifecycle of the FastAPI app."""
    logger.info("Starting Crawl4AI Microservice...")
    yield
    logger.info("Shutting down Crawl4AI Microservice...")

# Create FastAPI app with lifecycle management
app = FastAPI(
    title="Crawl4AI Microservice",
    description="Production FastAPI microservice for web crawling using async HTTP",
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

def html_to_markdown(html_content: str) -> str:
    """Convert HTML content to markdown format."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Extract text content with basic markdown formatting
        markdown_parts = []
        
        # Process headings
        for i in range(1, 7):
            for heading in soup.find_all(f'h{i}'):
                prefix = '#' * i
                text = heading.get_text(strip=True)
                if text:
                    markdown_parts.append(f"{prefix} {text}\n")
                heading.decompose()
        
        # Process paragraphs
        for p in soup.find_all('p'):
            text = p.get_text(strip=True)
            if text:
                markdown_parts.append(f"{text}\n\n")
        
        # Process lists
        for ul in soup.find_all('ul'):
            for li in ul.find_all('li'):
                text = li.get_text(strip=True)
                if text:
                    markdown_parts.append(f"- {text}\n")
            markdown_parts.append("\n")
        
        for ol in soup.find_all('ol'):
            for i, li in enumerate(ol.find_all('li'), 1):
                text = li.get_text(strip=True)
                if text:
                    markdown_parts.append(f"{i}. {text}\n")
            markdown_parts.append("\n")
        
        # Get remaining text
        remaining_text = soup.get_text(strip=True)
        if remaining_text:
            # Clean up extra whitespace
            lines = [line.strip() for line in remaining_text.split('\n') if line.strip()]
            if lines:
                markdown_parts.append('\n'.join(lines))
        
        return ''.join(markdown_parts).strip()
        
    except Exception as e:
        logger.warning(f"Failed to convert HTML to markdown: {e}")
        return html_content

def extract_headings(html_content: str) -> List[Dict[str, Any]]:
    """Extract headings from HTML content."""
    try:
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

def extract_metadata(html_content: str, url: str) -> Dict[str, Any]:
    """Extract metadata from HTML content."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Title
        title = ""
        if soup.title:
            title = soup.title.string.strip()
        
        # Meta description
        description = ""
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag:
            description = desc_tag.get('content', '').strip()
        
        # Meta keywords
        keywords = []
        keywords_tag = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_tag:
            keywords_str = keywords_tag.get('content', '')
            keywords = [k.strip() for k in keywords_str.split(',') if k.strip()]
        
        # Author
        author = ""
        author_tag = soup.find('meta', attrs={'name': 'author'})
        if author_tag:
            author = author_tag.get('content', '').strip()
        
        # Language
        language = "en"
        html_tag = soup.find('html')
        if html_tag and html_tag.get('lang'):
            language = html_tag.get('lang')
        
        return {
            "title": title,
            "description": description,
            "keywords": keywords,
            "author": author,
            "language": language,
            "url": url
        }
        
    except Exception as e:
        logger.warning(f"Failed to extract metadata: {e}")
        return {
            "title": url,
            "description": "",
            "keywords": [],
            "author": "",
            "language": "en",
            "url": url
        }

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
    return {
        "service": "Crawl4AI Microservice",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "crawler_initialized": True,
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
    if not url:
        raise HTTPException(status_code=400, detail="URL parameter is required")
    
    if not url.startswith(('http://', 'https://')):
        url = f'https://{url}'
    
    logger.info(f"Crawling URL: {url}")
    
    try:
        start_time = datetime.now()
        
        # Use aiohttp for async HTTP requests
        async with aiohttp.ClientSession() as session:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            timeout = aiohttp.ClientTimeout(total=30)
            
            async with session.get(url, headers=headers, timeout=timeout) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}: {response.reason}")
                
                html_content = await response.text()
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Extract content
        markdown_content = html_to_markdown(html_content)
        
        # Extract headings and schema
        headings = extract_headings(html_content)
        schema_markup = extract_schema_markup(html_content)
        
        # Extract metadata
        metadata = extract_metadata(html_content, url)
        
        # Calculate word count
        word_count = len(markdown_content.split()) if markdown_content else 0
        
        # Add additional metadata
        metadata.update({
            "timestamp": end_time.isoformat(),
            "crawl_duration": round(duration, 2),
            "word_count": word_count,
            "status": "success"
        })
        
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
        "simple-crawl-service:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable reload in production
        log_level="info"
    )