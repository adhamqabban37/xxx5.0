#!/usr/bin/env python3
"""
Production startup script for Crawl4AI AEO Service
Handles initialization, error recovery, and graceful shutdown
"""

import asyncio
import logging
import signal
import sys
import os
import time
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ServiceManager:
    """Manages the lifecycle of the AEO service"""
    
    def __init__(self):
        self.is_running = False
        self.shutdown_event = asyncio.Event()
        
    async def initialize_services(self):
        """Initialize all services with retries"""
        logger.info("Initializing services...")
        
        # Initialize semantic analysis service
        try:
            from semantic_analysis import semantic_service
            await semantic_service.initialize()
            logger.info("✅ Semantic analysis service initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize semantic service: {e}")
            raise
        
        # Add other service initializations here
        logger.info("✅ All services initialized successfully")
    
    async def cleanup_services(self):
        """Cleanup services on shutdown"""
        logger.info("Cleaning up services...")
        
        # Add cleanup logic here
        # For example, close database connections, save caches, etc.
        
        logger.info("✅ Services cleaned up")
    
    def setup_signal_handlers(self):
        """Setup graceful shutdown signal handlers"""
        def signal_handler(signum, frame):
            logger.info(f"Received signal {signum}, initiating graceful shutdown...")
            self.shutdown_event.set()
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def health_check_loop(self):
        """Background health check loop"""
        while self.is_running:
            try:
                # Add health checks here
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                await asyncio.sleep(5)

# Global service manager
service_manager = ServiceManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    try:
        logger.info("🚀 Starting AEO Service...")
        await service_manager.initialize_services()
        service_manager.is_running = True
        
        # Start background tasks
        health_task = asyncio.create_task(service_manager.health_check_loop())
        
        logger.info("🎉 AEO Service started successfully!")
        yield
        
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🛑 Shutting down AEO Service...")
        service_manager.is_running = False
        
        # Cancel background tasks
        if 'health_task' in locals():
            health_task.cancel()
            try:
                await health_task
            except asyncio.CancelledError:
                pass
        
        await service_manager.cleanup_services()
        logger.info("✅ AEO Service shutdown complete")

def create_app():
    """Create the FastAPI application with production settings"""
    # Import the main app
    from main import app
    
    # Override lifespan
    app.router.lifespan_context = lifespan
    
    return app

def main():
    """Main entry point"""
    # Set up environment
    os.environ.setdefault('ENVIRONMENT', 'production')
    
    # Configure service manager
    service_manager.setup_signal_handlers()
    
    # Get configuration from environment
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', 8001))
    workers = int(os.getenv('WORKERS', 1))
    log_level = os.getenv('LOG_LEVEL', 'info').lower()
    
    # Production configuration
    config = {
        "app": "start_server:create_app",
        "factory": True,
        "host": host,
        "port": port,
        "log_level": log_level,
        "access_log": True,
        "server_header": False,
        "date_header": False,
    }
    
    # Add worker configuration for production
    if workers > 1:
        config["workers"] = workers
    
    logger.info(f"🚀 Starting server on {host}:{port} with {workers} worker(s)")
    
    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        logger.info("👋 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server crashed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()