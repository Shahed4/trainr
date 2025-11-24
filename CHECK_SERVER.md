# Quick Check: Is the Server Running?

If the camera isn't showing, first check if the OpenPose server is running:

## Check Server Status

```bash
# Check if port 5001 is in use
lsof -i :5001

# Or check for Python process
ps aux | grep openpose
```

## Start the Server

If it's not running, start it:

```bash
cd trainr/openpose
source venv/bin/activate
python openpose.py
```

You should see:
```
Starting OpenPose server...
Server will run on http://localhost:5001
Press Ctrl+C to stop the server
==================================================
 * Running on http://127.0.0.1:5001
```

## Test the Video Feed Directly

Open this URL in your browser:
```
http://localhost:5001/video-feed?exercise=external_rotation
```

You should see a video stream. If you see an error or nothing, the server isn't working properly.

