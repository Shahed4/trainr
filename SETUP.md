# Local Setup Guide for Trainr

This guide will help you set up and run the Trainr application locally for testing.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
3. **Webcam/Camera** - For pose detection

## Step 1: Install Frontend Dependencies (Next.js)

1. Navigate to the project root directory:
   ```bash
   cd trainr
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

## Step 2: Install Backend Dependencies (Python/OpenPose)

1. Navigate to the openpose directory:
   ```bash
   cd openpose
   ```

2. Create a virtual environment (recommended):
   ```bash
   python3 -m venv venv
   ```

3. Activate the virtual environment:
   - **On macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```
   - **On Windows:**
     ```bash
     venv\Scripts\activate
     ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Step 3: Run the Application

You need to run **two servers** simultaneously:

### Option A: Run Both Servers in Separate Terminals (Recommended)

**Terminal 1 - Backend (OpenPose Flask Server):**
```bash
cd trainr/openpose
source venv/bin/activate  # IMPORTANT: Activate virtual environment first!
python openpose.py
```

**⚠️ IMPORTANT:** You MUST activate the virtual environment before running the script, otherwise you'll get "ModuleNotFoundError: No module named 'cv2'" and the server won't start.

You should see output like:
```
 * Running on http://127.0.0.1:5001
```

**Terminal 2 - Frontend (Next.js):**
```bash
cd trainr
npm run dev
```

You should see output like:
```
  ▲ Next.js 15.5.6
  - Local:        http://localhost:3000
```

### Option B: Use the npm script (if concurrently is installed)

If you want to run both servers with one command, first install `concurrently`:
```bash
npm install --save-dev concurrently
```

Then update the `both` script in `package.json` and run:
```bash
npm run both
```

## Step 4: Access the Application

1. Open your browser and navigate to:
   - **Main page:** http://localhost:3000
   - **Therapy page:** http://localhost:3000/therapy
   - **External rotation exercise:** http://localhost:3000/therapy/external

2. Make sure your webcam is connected and accessible by your browser.

3. Select an exercise from the dropdown menu (External Shoulder Rotation or Push Up).

4. The video feed should show:
   - Your pose with skeleton overlay
   - Exercise name at the top
   - Real-time form feedback (green border = good form, red border = needs correction)
   - Score tracking

## Troubleshooting

### Camera Not Working
- Make sure your webcam is connected and not being used by another application
- Grant camera permissions to your browser
- Try changing the camera index in `openpose.py` (line 72): `cv.VideoCapture(0)` to `cv.VideoCapture(1)` if you have multiple cameras

### Port Already in Use
- If port 5001 is in use, change it in `openpose.py` (line 317): `app.run(port=5001)`
- Update the frontend URLs accordingly (change `localhost:5001` to your new port)

### Python Dependencies Issues
- Make sure you're using Python 3.8+
- Try upgrading pip: `pip install --upgrade pip`
- If OpenCV installation fails, try: `pip install opencv-python-headless`

### Next.js Issues
- Clear the `.next` cache: `rm -rf .next` (or `rmdir /s .next` on Windows)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### CORS Issues
If you encounter CORS errors, you may need to install flask-cors:
```bash
pip install flask-cors
```

Then add to `openpose.py`:
```python
from flask_cors import CORS
CORS(app)
```

## Testing Different Exercises

1. **External Shoulder Rotation:**
   - Select "External Shoulder Rotation" from the dropdown
   - Keep your elbow at your side and rotate your arm outward
   - The system checks for proper elbow (0-120°) and shoulder (70-120°) angles

2. **Push Up:**
   - Select "Push Up" from the dropdown
   - Get into a plank position
   - The system checks for body alignment and elbow bend

## Stopping the Servers

- Press `Ctrl+C` in each terminal to stop the servers
- If using a virtual environment, you can deactivate it with: `deactivate`

