#!/usr/bin/env python3
"""
Temporary Mock Crawl4AI Service for AEO Platform Development
Simulates the expected Crawl4AI service behavior for testing
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List
from urllib.parse import urlparse
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

app = FastAPI(title="Mock Crawl4AI Service", version="1.0.0")

class ScanRequest(BaseModel):
    url: HttpUrl
    scan_type: str = "full"
    include_ai_analysis: bool = True
    user_agent: str = "XenlixAI-Bot/1.0"

class MockScanResponse(BaseModel):
    url: str
    title: str
    meta_description: str
    headings: Dict[str, List[str]]
    extracted_content: str
    structured_data: List[Dict[str, Any]]
    canonical: str
    og_title: str
    og_description: str
    word_count: int
    processing_time_ms: int
    timestamp: str

def generate_mock_content(url: str) -> MockScanResponse:
    """Generate realistic mock content for testing"""
    domain = urlparse(url).netloc
    
    # Mock content that varies by domain
    mock_data = {
        "url": url,
        "title": f"Professional Services - {domain}",
        "meta_description": f"Leading provider of professional services at {domain}. Contact us for expert solutions and consultation.",
        "headings": {
            "h1": [f"Welcome to {domain}"],
            "h2": ["Our Services", "About Us", "Contact Information", "Why Choose Us"],
            "h3": ["Expert Team", "Quality Service", "24/7 Support", "Competitive Pricing", "Customer Reviews"]
        },
        "extracted_content": f"""
        Welcome to {domain} - your trusted partner for professional services.
        
        Our Services:
        We provide comprehensive solutions including consultation, implementation, and ongoing support. 
        Our expert team has years of experience helping businesses achieve their goals.
        
        About Us:
        Founded in 2020, we have quickly become a leading provider in our industry. 
        Our commitment to quality and customer satisfaction sets us apart from the competition.
        
        Contact Information:
        Phone: (555) 123-4567
        Email: info@{domain}
        Address: 123 Business Ave, City, State 12345
        Business Hours: Monday-Friday 9AM-6PM, Saturday 10AM-4PM
        
        Why Choose Us:
        - Expert team with proven track record
        - Competitive pricing and flexible payment options  
        - 24/7 customer support
        - 100% satisfaction guarantee
        - Free initial consultation
        
        Customer Reviews:
        "Excellent service and professional team!" - John D.
        "Highly recommend for anyone looking for quality solutions." - Sarah M.
        "Fast response time and great results!" - Mike R.
        """,
        "structured_data": [
            {
                "@type": "Organization",
                "name": f"{domain} Services",
                "url": url,
                "telephone": "(555) 123-4567",
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "123 Business Ave",
                    "addressLocality": "City",
                    "addressRegion": "State",
                    "postalCode": "12345"
                }
            },
            {
                "@type": "Service",
                "name": "Professional Consultation",
                "provider": f"{domain} Services",
                "description": "Expert consultation services"
            }
        ],
        "canonical": url,
        "og_title": f"Professional Services - {domain}",
        "og_description": f"Leading provider of professional services at {domain}. Contact us for expert solutions.",
        "word_count": 245,
        "processing_time_ms": 1250,
        "timestamp": datetime.now().isoformat()
    }
    
    return MockScanResponse(**mock_data)

@app.get("/")
async def root():
    return {"message": "Mock Crawl4AI Service - Ready for testing"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mock-crawl4ai", "version": "1.0.0"}

@app.post("/scan")
async def scan_url(request: ScanRequest):
    """Main endpoint that mimics Crawl4AI service behavior"""
    try:
        # Simulate processing time
        await asyncio.sleep(0.5)  # Simulate crawl delay
        
        # Generate mock response
        response = generate_mock_content(str(request.url))
        
        return response.model_dump()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@app.get("/scan/{scan_id}")
async def get_scan_result(scan_id: str):
    """Get scan result by ID (for async processing)"""
    return {"scan_id": scan_id, "status": "completed", "message": "Mock implementation"}

if __name__ == "__main__":
    print("🚀 Starting Mock Crawl4AI Service on port 8001")
    print("📋 Available endpoints:")
    print("   POST /scan - Main crawling endpoint")
    print("   GET /health - Health check")
    print("   GET / - Service info")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
        log_level="info"
    )