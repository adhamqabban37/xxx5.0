import uvicorn
import os
from pathlib import Path

if __name__ == "__main__":
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass  # dotenv is optional
    
    host = os.getenv("CRAWL4AI_HOST", "0.0.0.0")
    port = int(os.getenv("CRAWL4AI_PORT", "8001"))
    
    print(f"🚀 Starting Crawl4AI service on {host}:{port}")
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        workers=1,
        reload=False,
        log_level="info"
    )
