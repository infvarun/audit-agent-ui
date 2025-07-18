#!/bin/bash
# Development server startup script
# This script starts both Python backend and React frontend

echo "🚀 Starting Audit Data Collection Application"
echo "=============================================="

# Start Python backend in background
echo "📡 Starting Python FastAPI backend on port 8000..."
python3 start_python_backend.py &
PYTHON_PID=$!

# Wait for Python server to initialize
echo "⏳ Waiting for Python backend to start..."
sleep 5

# Start React frontend
echo "🎨 Starting React frontend on port 5173..."
npm run dev

# Cleanup function
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $PYTHON_PID 2>/dev/null
    exit 0
}

# Trap signals to cleanup
trap cleanup SIGINT SIGTERM

# Wait for processes
wait