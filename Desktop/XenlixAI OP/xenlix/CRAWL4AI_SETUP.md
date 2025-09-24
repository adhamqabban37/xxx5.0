# Crawl4AI Integration Setup

This document explains how to set up and use the Crawl4AI integration with your XenlixAI AEO platform.

## 🚀 Quick Start

### Option 1: Using the Startup Scripts (Recommended)

**Windows Users:**
```bash
# Double-click or run:
start-services.bat
```

**Linux/Mac Users:**
```bash
chmod +x start-services.sh
./start-services.sh
```

### Option 2: Manual Setup

1. **Start Crawl4AI Service:**
```bash
cd crawl4ai-service
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Start Next.js Application:**
```bash
# In a new terminal, from the project root
pnpm install
pnpm run dev
```

### Option 3: Using Docker

```bash
docker-compose up --build
```

## 📡 Services

- **Next.js Application:** http://localhost:3000
- **Crawl4AI API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## 🏗️ Architecture

### Service Integration

```
┌─────────────────┐    HTTP API    ┌──────────────────┐
│   Next.js App   │───────────────▶│  Crawl4AI Service│
│   (Port 3000)   │                │   (Port 8000)    │
└─────────────────┘                └──────────────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────┐                ┌──────────────────┐
│  Scan Queue     │                │   Python Crawler │
│  Rate Limiting  │                │   AEO Analysis   │
│  Job Management │                │   Chrome Browser │
└─────────────────┘                └──────────────────┘
```

### Scan Process Flow

1. **User Request** → Next.js API receives scan request
2. **Queue Management** → Request added to scan queue with priority
3. **Service Selection** → Crawl4AI service attempted first, local scanner as fallback
4. **Website Crawling** → Crawl4AI extracts content, metadata, and structured data
5. **AEO Analysis** → Advanced analysis for voice search, FAQ structure, schema compliance
6. **Result Storage** → Results cached and returned to user interface

## 🔧 Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# Crawl4AI Service Configuration
CRAWL4AI_SERVICE_URL="http://localhost:8000"
CRAWL4AI_ENABLED=true
```

### Crawl4AI Service Features

- **Advanced Web Crawling:** Uses headless Chrome for JavaScript-heavy sites
- **Schema Detection:** Automatically finds and parses JSON-LD structured data
- **AEO Analysis:** Specialized scoring for Answer Engine Optimization
- **Content Extraction:** Clean text extraction with metadata preservation
- **FAQ Detection:** Identifies and structures question-answer patterns

## 📊 AEO Analysis Metrics

The Crawl4AI service provides comprehensive AEO scoring:

### 1. Schema Compliance Score (0-100)
- JSON-LD structured data presence
- FAQ schema implementation
- Local business schema
- Article/BlogPosting schema

### 2. Voice Search Readiness (0-100)
- Natural language question patterns
- Conversational tone indicators
- Sentence length optimization
- Clear answer structures

### 3. Snippet Optimization Score (0-100)
- Title length and optimization
- Meta description quality
- Heading structure (H1-H6)
- Content readability

### 4. FAQ Structure Score (0-100)
- FAQ schema implementation
- Question-answer patterns
- FAQ section indicators
- Question headings

### 5. Local Optimization Score (0-100)
- Local business schema
- NAP (Name, Address, Phone) information
- Location-based content indicators

## 🛠️ API Endpoints

### Crawl4AI Service Endpoints

- `POST /scan` - Scan a website with AEO analysis
- `GET /health` - Service health check
- `GET /` - API information

### Next.js API Integration

- `POST /api/scan` - Queue a website scan
- `GET /api/scan/[id]` - Get scan status and results

## 📝 Example Usage

### Scanning a Website

```typescript
// Using the integrated API
const response = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    scanType: 'full', // Uses Crawl4AI
    priority: 'normal'
  })
});

const { scanId } = await response.json();
```

### Checking Results

```typescript
// Poll for results
const response = await fetch(`/api/scan/${scanId}`);
const result = await response.json();

if (result.status === 'completed') {
  console.log('AEO Score:', result.result.aeo_analysis?.overall_aeo_score);
  console.log('Recommendations:', result.result.recommendations);
}
```

## 🔄 Fallback System

The integration includes automatic fallback:

1. **Primary:** Crawl4AI service for advanced analysis
2. **Fallback:** Local scanner if Crawl4AI unavailable
3. **Error Handling:** Graceful degradation with user notification

## 🐛 Troubleshooting

### Common Issues

**Crawl4AI Service Won't Start:**
- Check Python installation: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check port 8000 availability: `netstat -an | grep 8000`

**Connection Errors:**
- Verify CRAWL4AI_SERVICE_URL in environment variables
- Check firewall settings for port 8000
- Ensure both services are running

**Scan Timeouts:**
- Large sites may take longer than 60 seconds
- Check website accessibility and robots.txt
- Monitor service logs for errors

### Logs and Debugging

**Crawl4AI Service Logs:**
```bash
cd crawl4ai-service
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug
```

**Next.js Development Logs:**
Check the terminal running `pnpm run dev` for integration errors.

## 🔒 Security Considerations

- Rate limiting implemented for scan requests
- User authentication required for all scans
- Crawl4AI service runs on localhost only
- No sensitive data stored in scan results
- CORS configured for Next.js integration only

## 🚦 Performance

### Optimization Features

- **Queue System:** Prevents server overload with concurrent limits
- **Caching:** Results cached for 1 hour to avoid duplicate work
- **Rate Limiting:** 3 scans per minute per user
- **Timeout Handling:** 60-second scan timeout with graceful failures

### Monitoring

Monitor service health via:
- Health endpoints: `/health`
- Queue statistics via scan queue API
- Server logs for error tracking

## 📈 Future Enhancements

Planned improvements:
- Redis integration for distributed caching
- Database persistence for scan history
- Batch scan processing
- Advanced AI analysis with OpenAI/HuggingFace
- Real-time WebSocket updates
- Custom extraction strategies