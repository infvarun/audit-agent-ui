#!/usr/bin/env python3
"""
Simple Python server startup script that replaces the Node.js server
"""

import subprocess
import sys
import os
import time

def main():
    """Start the Python FastAPI server"""
    
    # Set environment variables
    os.environ["NODE_ENV"] = "development"
    os.environ["PORT"] = "5000"
    
    # Kill any existing Node.js processes
    try:
        subprocess.run(["pkill", "-f", "tsx server/index.ts"], check=False)
        time.sleep(2)
    except Exception:
        pass
    
    # Start the Python server
    print("Starting Python FastAPI server on port 5000...")
    try:
        subprocess.run([
            "python3", "python_server.py"
        ], check=True)
    except KeyboardInterrupt:
        print("\nShutting down Python server...")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()