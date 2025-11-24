@echo off
REM Script to start the OpenPose backend server (Windows)
REM Usage: start-backend.bat

cd openpose

REM Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
)

REM Check if requirements are installed
python -c "import cv2" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
)

echo Starting OpenPose backend server on port 5001...
python openpose.py

