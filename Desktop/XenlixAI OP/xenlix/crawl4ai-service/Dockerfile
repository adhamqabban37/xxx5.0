# Lightweight Python image
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install system dependencies needed by crawl4ai/selenium
RUN apt-get update && apt-get install -y \
  build-essential g++ \
  chromium-driver chromium \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libasound2 \
  curl gnupg \
  && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN python -m pip install --upgrade pip && \
  pip install --no-cache-dir -r requirements.txt && \
  python -m playwright install --with-deps chromium

# Copy service
COPY . .

# Expose service port
EXPOSE 8001

# Healthcheck to /health
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -fsS http://localhost:8001/health || exit 1

# Env defaults
ENV CRAWL4AI_HOST=0.0.0.0
ENV CRAWL4AI_PORT=8001

# Run
CMD ["python", "main.py"]
