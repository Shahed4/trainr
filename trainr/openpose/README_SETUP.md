# How to Run OpenPose Server

## The Problem
If you see "Unable to connect to OpenPose server" and the script stops running, it's usually because:
1. The virtual environment isn't activated
2. Python dependencies aren't installed
3. Camera access issues

## Solution

### Step 1: Make sure you're in the right directory
```bash
cd trainr/openpose
```

### Step 2: Activate the virtual environment
```bash
source venv/bin/activate
```

You should see `(venv)` at the start of your terminal prompt.

### Step 3: Run the server
```bash
python openpose.py
```

You should see:
```
Starting OpenPose server...
Server will run on http://localhost:5001
Press Ctrl+C to stop the server
 * Running on http://127.0.0.1:5001
```

## Quick Method (Using the helper script)

Simply run:
```bash
cd trainr/openpose
./run.sh
```

## Troubleshooting

### "ModuleNotFoundError: No module named 'cv2'"
- Make sure the virtual environment is activated (you should see `(venv)` in your prompt)
- If not activated, run: `source venv/bin/activate`
- Then install: `pip install -r requirements.txt`

### "Could not open camera"
- Make sure your webcam is connected
- Close other applications using the camera (Zoom, Teams, etc.)
- Try changing the camera index in `openpose.py` line 215: `cv.VideoCapture(1)` instead of `cv.VideoCapture(0)`

### Script starts then immediately stops
- Check the terminal output for error messages
- Make sure the model file `graph_opt.pb` exists in the `openpose` directory
- Verify camera permissions in System Settings (macOS) or Privacy Settings (Windows)

## Important Notes

- **Always activate the virtual environment before running the script**
- Keep the terminal window open while the server is running
- The server must be running before you open the frontend in your browser

