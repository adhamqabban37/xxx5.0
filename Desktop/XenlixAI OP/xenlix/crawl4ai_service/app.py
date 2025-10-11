# app.py
import asyncio
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from loguru import logger
import httpx

# Lazy import your lightweight module (no side effects at import time)
try:
    from semantic_analysis_simple import extract_text, analyze
except Exception as e:
    # Fail fast with clear message rather than crashing later
    raise RuntimeError(f"Failed to import lightweight analyzer: {e}") from e

app = FastAPI(title="Lightweight Crawler & Analyzer", version="1.0.0")

# Reuse a single AsyncClient across requests
_http_client: Optional[httpx.AsyncClient] = None

@app.on_event("startup")
async def startup():
    global _http_client
    # conservative timeouts and limits; no HTTP/2 requirement
    _http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(10.0, read=20.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        follow_redirects=True,
        headers={"User-Agent": "LightCrawler/1.0 (+fastapi)"}
    )
    logger.info("HTTP client initialized")

@app.on_event("shutdown")
async def shutdown():
    global _http_client
    if _http_client:
        await _http_client.aclose()
        logger.info("HTTP client closed")

@app.get("/healthz", response_class=PlainTextResponse)
async def healthz():
    return "ok"

@app.get("/health")
async def health():
    """Legacy health endpoint for compatibility"""
    return {"status": "ok", "service": "lightweight-crawler", "version": "1.0.0"}

@app.get("/analyze")
async def analyze_url(
    url: str = Query(..., description="HTTP/HTTPS URL to fetch and analyze"),
    max_bytes: int = Query(1_500_000, ge=50_000, le=10_000_000),  # 1.5MB default cap
):
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    global _http_client
    if _http_client is None:
        raise HTTPException(status_code=503, detail="HTTP client not ready")

    try:
        # HEAD first to respect size caps when possible
        try:
            head = await _http_client.head(url)
            cl = head.headers.get("Content-Length")
            if cl and cl.isdigit() and int(cl) > max_bytes:
                raise HTTPException(status_code=413, detail=f"Content too large (> {max_bytes} bytes)")
        except Exception as e:
            logger.warning(f"HEAD failed ({e}); proceeding with GET")

        # Stream and enforce byte cap
        async with _http_client.stream("GET", url) as resp:
            if resp.status_code >= 400:
                raise HTTPException(status_code=resp.status_code, detail=f"Upstream returned {resp.status_code}")
            buf = bytearray()
            async for chunk in resp.aiter_bytes():
                buf.extend(chunk)
                if len(buf) > max_bytes:
                    raise HTTPException(status_code=413, detail=f"Content too large (> {max_bytes} bytes)")
        html = buf.decode(resp.encoding or "utf-8", errors="ignore")

        text = extract_text(html)
        result = analyze(text)
        return JSONResponse({
            "url": url,
            "bytes_fetched": len(buf),
            "encoding": resp.encoding,
            "analysis": result,
            "ok": True,
            "status": "success"
        })
    except HTTPException:
        raise
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Fetch timed out")
    except Exception as e:
        logger.exception("Unhandled error during /analyze")
        raise HTTPException(status_code=500, detail=f"Internal error: {type(e).__name__}")

@app.get("/crawl")
async def crawl_legacy(url: str = Query(..., description="URL to crawl (legacy endpoint)")):
    """Legacy crawl endpoint - redirects to analyze"""
    return await analyze_url(url)
