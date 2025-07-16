#!/usr/bin/env python3
import subprocess
import os
import time

# Start Flask API in the background
def start_flask_api():
    os.chdir('/home/runner/workspace')
    
    # Activate virtual environment and run Flask API
    cmd = '''
    source .pythonlibs/bin/activate && 
    export PYTHONPATH=/home/runner/workspace:$PYTHONPATH && 
    python server/flask_api.py
    '''
    
    # Start as background process
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    
    # Wait a bit to ensure it starts
    time.sleep(2)
    
    # Check if process is still running
    if process.poll() is None:
        print("Flask API started successfully on port 5001")
        return True
    else:
        print("Failed to start Flask API")
        output = process.stdout.read().decode()
        print(f"Output: {output}")
        return False

if __name__ == "__main__":
    start_flask_api()