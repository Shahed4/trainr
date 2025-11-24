#!/bin/bash

# Script to run openpose.py with virtual environment activated
# Usage: ./run.sh

cd "$(dirname "$0")"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✓ Virtual environment activated"
else
    echo "✗ Virtual environment not found. Run: python3 -m venv venv"
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import cv2" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

echo "Starting OpenPose server on port 5001..."
echo "Press Ctrl+C to stop"
echo ""

python openpose.py

