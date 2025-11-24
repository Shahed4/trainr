#!/bin/bash

# Script to start the OpenPose backend server
# Usage: ./start-backend.sh

cd "$(dirname "$0")/openpose"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Check if requirements are installed
if ! python -c "import cv2" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi

echo "Starting OpenPose backend server on port 5001..."
python openpose.py

