#!/usr/bin/env python3
"""
Python FastAPI server with LangChain integration
Replaces the Node.js Express server
"""

import os
import sys
import uvicorn
from dotenv import load_dotenv

# Add the server directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Set up environment
    os.environ.setdefault("NODE_ENV", "development")
    
    # Get port from environment
    port = int(os.getenv("PORT", 5000))
    
    # Run the FastAPI server
    uvicorn.run(
        "server.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info",
        access_log=True
    )