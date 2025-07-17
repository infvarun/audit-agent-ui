from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn
import os
from dotenv import load_dotenv
import time
from typing import List, Optional
import json
from contextlib import asynccontextmanager
import sys
import subprocess

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from routes import router as api_router
    from storage import get_storage
    from database import create_tables
except ImportError:
    # Fallback imports
    from server.routes import router as api_router
    from server.storage import get_storage
    from server.database import create_tables

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    create_tables()
    yield

app = FastAPI(
    title="Audit Data Collection API",
    description="API for audit data collection wizard",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        log_line = f"{request.method} {request.url.path} {response.status_code} in {int(process_time * 1000)}ms"
        if len(log_line) > 80:
            log_line = log_line[:79] + "…"
        print(log_line)
    
    return response

# Include API routes
app.include_router(api_router, prefix="/api")

# Serve static files in production
if os.getenv("NODE_ENV") != "development":
    app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")
    app.mount("/", StaticFiles(directory="dist/public", html=True), name="static")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("NODE_ENV") == "development",
        log_level="info"
    )