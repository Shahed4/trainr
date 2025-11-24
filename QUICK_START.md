# Quick Start Guide

## Fast Setup (5 minutes)

### 1. Install Frontend Dependencies
```bash
cd trainr
npm install
```

### 2. Install Backend Dependencies
```bash
cd trainr/openpose
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run Both Servers

**Terminal 1 - Backend:**
```bash
cd trainr/openpose
source venv/bin/activate  # If using venv
python openpose.py
```

**Terminal 2 - Frontend:**
```bash
cd trainr
npm run dev
```

### 4. Open in Browser
- Go to: http://localhost:3000/therapy
- Select an exercise from the dropdown
- Make sure your webcam is on!

## Quick Troubleshooting

**Camera not working?**
- Check camera permissions in browser settings
- Try changing camera index in `openpose.py` line 215: `cv.VideoCapture(1)`

**Port 5001 in use?**
- Change port in `openpose.py` line 317: `app.run(port=5002)`
- Update frontend URLs from `localhost:5001` to `localhost:5002`

**Python packages not found?**
- Make sure virtual environment is activated
- Run: `pip install -r requirements.txt` again

