#!/usr/bin/env python3
"""
Simple Python server to test basic functionality
"""

import os
import sys
import time
import json
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# FastAPI app
app = FastAPI(title="Simple Python Server", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "simple-python-server", "timestamp": time.time()}

# Test endpoint
@app.get("/api/test")
async def test_endpoint():
    return {"message": "Python server is working!", "env": os.getenv("NODE_ENV", "unknown")}

# Simple applications endpoint
@app.get("/api/applications")
async def get_applications():
    return [
        {"id": 1, "name": "Test Application 1"},
        {"id": 2, "name": "Test Application 2"}
    ]

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting simple Python server on port {port}")
    
    try:
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=port,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)