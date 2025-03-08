#!/bin/bash

# Kill any existing uvicorn processes
echo "Stopping existing backend processes..."
pkill -f uvicorn

# Wait a moment to ensure ports are freed
sleep 2

# Activate virtual environment and start backend with logging
echo "Starting backend server..."
source venv/bin/activate && \
PYTHONPATH=$PYTHONPATH:. \
LOG_LEVEL=DEBUG \
uvicorn src.main:app --reload --log-level debug --port 8001
