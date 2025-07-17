#!/bin/bash

# Start the Python LangChain service
export LANGCHAIN_PORT=5001
echo "Starting Python LangChain service on port $LANGCHAIN_PORT"
cd /home/runner/workspace
python3 python_langchain_service.py