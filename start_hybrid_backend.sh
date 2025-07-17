#!/bin/bash

# Start hybrid backend with Node.js and Python services
echo "Starting hybrid backend..."

# Start Python LangChain service
export LANGCHAIN_PORT=5001
echo "Starting Python LangChain service on port $LANGCHAIN_PORT"
python3 python_langchain_service.py > langchain_service.log 2>&1 &
PYTHON_PID=$!

# Wait for Python service to start
sleep 3

# Check if Python service is running
if curl -s http://localhost:5001/health > /dev/null; then
    echo "Python LangChain service is running ✓"
else
    echo "Python LangChain service failed to start ✗"
    exit 1
fi

# Start Node.js server
echo "Starting Node.js server..."
npm run dev

# Cleanup function
cleanup() {
    echo "Shutting down services..."
    kill $PYTHON_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait