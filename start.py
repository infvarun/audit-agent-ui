#!/usr/bin/env python3
"""
Main startup script for the React + Python audit application
"""

import os
import sys
import subprocess
import asyncio
import signal
from pathlib import Path

def main():
    """Start the Python FastAPI server"""
    print("🚀 Starting React + Python Audit Application")
    print("=" * 50)
    
    # Change to the correct directory
    os.chdir(Path(__file__).parent)
    
    # Build React app if needed
    if not os.path.exists("dist/public"):
        print("📦 Building React frontend...")
        try:
            subprocess.run(["npm", "run", "build"], check=True)
            print("✅ React build completed")
        except subprocess.CalledProcessError:
            print("❌ React build failed")
            sys.exit(1)
    
    # Start Python server
    print("🐍 Starting Python FastAPI server...")
    try:
        # Import and run the server
        from server.main import app
        import uvicorn
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=5000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()