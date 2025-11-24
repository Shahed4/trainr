#!/usr/bin/env python3
"""
Simple test script to verify camera and model work before running the full server
"""
import cv2
import os
import sys

print("Testing OpenPose setup...")
print("=" * 50)

# Test 1: Check if model file exists
model_path = os.path.join(os.path.dirname(__file__), "graph_opt.pb")
print(f"1. Checking model file: {model_path}")
if os.path.exists(model_path):
    print(f"   ✓ Model file found ({os.path.getsize(model_path) / 1024 / 1024:.2f} MB)")
else:
    print(f"   ✗ Model file NOT found!")
    sys.exit(1)

# Test 2: Load model
print("2. Loading neural network model...")
try:
    net = cv2.dnn.readNetFromTensorflow(model_path)
    print("   ✓ Model loaded successfully")
except Exception as e:
    print(f"   ✗ Error loading model: {e}")
    sys.exit(1)

# Test 3: Open camera
print("3. Testing camera access...")
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("   ✗ Could not open camera (index 0)")
    # Try other indices
    for i in range(1, 4):
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            print(f"   ✓ Camera found at index {i}")
            break
    if not cap.isOpened():
        print("   ✗ Could not open any camera")
        sys.exit(1)
else:
    print("   ✓ Camera opened successfully (index 0)")

# Test 4: Read a frame
print("4. Testing frame capture...")
ret, frame = cap.read()
if ret:
    print(f"   ✓ Frame captured successfully ({frame.shape[1]}x{frame.shape[0]})")
else:
    print("   ✗ Could not read frame from camera")
    cap.release()
    sys.exit(1)

# Test 5: Test model inference
print("5. Testing model inference...")
try:
    inWidth, inHeight = 368, 368
    blob = cv2.dnn.blobFromImage(
        frame, 1.0, (inWidth, inHeight), (127.5, 127.5, 127.5), swapRB=True, crop=False
    )
    net.setInput(blob)
    out = net.forward()
    out = out[:, :22, :, :]
    print(f"   ✓ Model inference successful (output shape: {out.shape})")
except Exception as e:
    print(f"   ✗ Error during inference: {e}")
    import traceback
    traceback.print_exc()
    cap.release()
    sys.exit(1)

cap.release()
print("=" * 50)
print("✓ All tests passed! You can run the server now.")
print("Run: python openpose.py")

