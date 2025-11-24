import os
import cv2 as cv
import numpy as np
from flask import Flask, Response, request
import time
import signal
import sys

app = Flask(__name__)

# Global flag to control graceful shutdown
shutdown_flag = False

def signal_handler(sig, frame):
    """Handle shutdown signals gracefully"""
    global shutdown_flag
    print("\nShutdown signal received, cleaning up...")
    shutdown_flag = True
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Define body parts and pose pairs
BODY_PARTS = {
    "Nose": 0,
    "Neck": 1,
    "RShoulder": 2,
    "RElbow": 3,
    "RWrist": 4,
    "LShoulder": 5,
    "LElbow": 6,
    "LWrist": 7,
    "RHip": 8,
    "RKnee": 9,
    "RAnkle": 10,
    "LHip": 11,
    "LKnee": 12,
    "LAnkle": 13,
    "REye": 14,
    "LEye": 15,
    "REar": 16,
    "LEar": 17,
    "Background": 18,
    "UpperBack": 19,
    "MiddleBack": 20,
    "LowerBack": 21,
}

POSE_PAIRS = [
    ["Neck", "RShoulder"],
    ["Neck", "LShoulder"],
    ["RShoulder", "RElbow"],
    ["RElbow", "RWrist"],
    ["LShoulder", "LElbow"],
    ["LElbow", "LWrist"],
    ["Neck", "RHip"],
    ["RHip", "RKnee"],
    ["RKnee", "RAnkle"],
    ["Neck", "LHip"],
    ["LHip", "LKnee"],
    ["LKnee", "LAnkle"],
    ["Neck", "Nose"],
    ["Nose", "REye"],
    ["REye", "REar"],
    ["Nose", "LEye"],
    ["LEye", "LEar"],
    ["Neck", "UpperBack"],
    ["UpperBack", "MiddleBack"],
    ["MiddleBack", "LowerBack"],
]

# Load the neural network (use absolute path relative to this file)
model_path = os.path.join(os.path.dirname(__file__), "graph_opt.pb")
try:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    print(f"Loading model from: {model_path}")
    net = cv.dnn.readNetFromTensorflow(model_path)
    print("Model loaded successfully")
except Exception as e:
    print(f"ERROR loading model: {e}")
    import traceback
    traceback.print_exc()
    raise

# Variables for scoring (per exercise session)
scoring_data = {}

def get_scoring_data(exercise_type):
    """Get or create scoring data for an exercise type"""
    if exercise_type not in scoring_data:
        scoring_data[exercise_type] = {
            'green_border_count': 0,
            'red_border_count': 0,
            'last_score_time': time.time(),
            'current_score': 0
        }
    return scoring_data[exercise_type]

def calculate_angle(p1, p2, p3):
    """Calculate angle between three points (p2 is the vertex)"""
    v1 = p1 - p2
    v2 = p3 - p2
    angle_rad = np.arctan2(v2[1], v2[0]) - np.arctan2(v1[1], v1[0])
    angle_deg = np.degrees(angle_rad)
    angle_deg = angle_deg + 360 if angle_deg < 0 else angle_deg
    angle_deg = 360 - angle_deg if angle_deg > 180 else angle_deg
    return angle_deg

def check_external_rotation_form(points, frame):
    """Check form for external shoulder rotation exercise"""
    try:
        elbow_angle_ok = shoulder_angle_ok = False
        feedback_text = []
        
        # Check right arm (can be extended to check both arms)
        if (
            points[BODY_PARTS["RShoulder"]] and 
            points[BODY_PARTS["RElbow"]] and 
            points[BODY_PARTS["RWrist"]]
        ):
            shoulder = np.array(points[BODY_PARTS["RShoulder"]])
            elbow = np.array(points[BODY_PARTS["RElbow"]])
            wrist = np.array(points[BODY_PARTS["RWrist"]])

            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            elbow_angle_ok = 0 <= elbow_angle <= 120
            feedback_text.append(f"Elbow: {int(elbow_angle)}°")
            
            # Check if coordinates are within frame bounds before drawing
            elbow_pos = points[BODY_PARTS["RElbow"]]
            if 0 <= elbow_pos[0] < frame.shape[1] and 0 <= elbow_pos[1] < frame.shape[0]:
                cv.putText(
                    frame, f"Elbow Angle: {int(elbow_angle)}", 
                    (elbow_pos[0] + 10, elbow_pos[1]),
                    cv.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2,
                )

        if (
            points[BODY_PARTS["Neck"]] and 
            points[BODY_PARTS["RShoulder"]] and 
            points[BODY_PARTS["RElbow"]]
        ):
            neck = np.array(points[BODY_PARTS["Neck"]])
            shoulder = np.array(points[BODY_PARTS["RShoulder"]])
            elbow = np.array(points[BODY_PARTS["RElbow"]])

            shoulder_angle = calculate_angle(neck, shoulder, elbow)
            shoulder_angle_ok = 70 <= shoulder_angle <= 120
            feedback_text.append(f"Shoulder: {int(shoulder_angle)}°")
            
            # Check if coordinates are within frame bounds before drawing
            shoulder_pos = points[BODY_PARTS["RShoulder"]]
            if 0 <= shoulder_pos[0] < frame.shape[1] and 0 <= shoulder_pos[1] < frame.shape[0]:
                cv.putText(
                    frame, f"Shoulder Angle: {int(shoulder_angle)}",
                    (shoulder_pos[0] + 10, shoulder_pos[1] + 20),
                    cv.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2,
                )

        # If no body parts detected, return True (neutral) so stream continues
        if not elbow_angle_ok and not shoulder_angle_ok:
            return True, ["Position yourself in view"]
        
        return elbow_angle_ok and shoulder_angle_ok, feedback_text
    except Exception as e:
        print(f"Error in check_external_rotation_form: {e}")
        import traceback
        traceback.print_exc()
        # Return True to keep stream running even if form check fails
        return True, ["Error checking form"]

def check_pushup_form(points, frame):
    """Check form for push-up exercise"""
    try:
        form_ok = False
        feedback_text = []
        
        # Check if body is in plank position (shoulders, hips, ankles roughly aligned)
        if (
            points[BODY_PARTS["RShoulder"]] and 
            points[BODY_PARTS["RHip"]] and 
            points[BODY_PARTS["RAnkle"]] and
            points[BODY_PARTS["LShoulder"]] and 
            points[BODY_PARTS["LHip"]] and 
            points[BODY_PARTS["LAnkle"]]
        ):
            # Calculate body alignment (should be roughly horizontal)
            shoulder_avg = (
                np.array(points[BODY_PARTS["RShoulder"]]) + 
                np.array(points[BODY_PARTS["LShoulder"]])
            ) / 2
            hip_avg = (
                np.array(points[BODY_PARTS["RHip"]]) + 
                np.array(points[BODY_PARTS["LHip"]])
            ) / 2
            ankle_avg = (
                np.array(points[BODY_PARTS["RAnkle"]]) + 
                np.array(points[BODY_PARTS["LAnkle"]])
            ) / 2
            
            # Check if body is relatively straight (vertical difference should be small)
            body_angle = np.degrees(np.arctan2(
                ankle_avg[1] - shoulder_avg[1],
                abs(ankle_avg[0] - shoulder_avg[0]) if abs(ankle_avg[0] - shoulder_avg[0]) > 0.1 else 0.1
            ))
            body_aligned = abs(body_angle) < 15  # Body should be within 15 degrees of horizontal
            
            # Check elbow angles (should be bent during push-up)
            if (
                points[BODY_PARTS["RShoulder"]] and 
                points[BODY_PARTS["RElbow"]] and 
                points[BODY_PARTS["RWrist"]]
            ):
                shoulder = np.array(points[BODY_PARTS["RShoulder"]])
                elbow = np.array(points[BODY_PARTS["RElbow"]])
                wrist = np.array(points[BODY_PARTS["RWrist"]])
                
                elbow_angle = calculate_angle(shoulder, elbow, wrist)
                elbow_bent = 60 <= elbow_angle <= 160  # Elbow should be bent during push-up
                
                feedback_text.append(f"Body Angle: {int(body_angle)}°")
                feedback_text.append(f"Elbow: {int(elbow_angle)}°")
                
                # Check frame bounds before drawing
                if frame.shape[0] > 60 and frame.shape[1] > 10:
                    cv.putText(
                        frame, f"Body Angle: {int(body_angle)}°", 
                        (10, 60), cv.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2,
                    )
                
                elbow_pos = points[BODY_PARTS["RElbow"]]
                if 0 <= elbow_pos[0] < frame.shape[1] and 0 <= elbow_pos[1] < frame.shape[0]:
                    cv.putText(
                        frame, f"Elbow Angle: {int(elbow_angle)}°", 
                        (elbow_pos[0] + 10, elbow_pos[1]),
                        cv.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2,
                    )

                form_ok = body_aligned and elbow_bent
            else:
                form_ok = body_aligned
                feedback_text.append(f"Body Angle: {int(body_angle)}°")
        else:
            # If body parts not detected, return True to keep stream running
            form_ok = True
            feedback_text.append("Position yourself in view")
        
        return form_ok, feedback_text
    except Exception as e:
        print(f"Error in check_pushup_form: {e}")
        import traceback
        traceback.print_exc()
        # Return True to keep stream running even if form check fails
        return True, ["Error checking form"]

def check_exercise_form(exercise_type, points, frame):
    """Route to appropriate form checking function based on exercise type"""
    if exercise_type == "external_rotation":
        return check_external_rotation_form(points, frame)
    elif exercise_type == "pushup":
        return check_pushup_form(points, frame)
    else:
        # Default: no form checking, just show pose
        return True, ["No form checking for this exercise"]

def create_error_frame(message):
    """Create a frame with an error message"""
    frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv.putText(frame, message, (50, 240), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
    cv.putText(frame, "Check terminal for details", (50, 280), cv.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    ret, buffer = cv.imencode('.jpg', frame)
    return buffer.tobytes()

# Function to generate video frames
def generate_frames(exercise_type="none"):
    global scoring_data
    cap = None
    
    try:
        cap = cv.VideoCapture(0)  # 0 for the default camera
        
        # Check if camera opened successfully
        if not cap.isOpened():
            print("Error: Could not open camera. Make sure your webcam is connected and not being used by another application.")
            # Try alternative camera indices
            for i in range(1, 4):
                cap = cv.VideoCapture(i)
                if cap.isOpened():
                    print(f"Camera found at index {i}")
                    break
            if not cap.isOpened():
                print("ERROR: Could not open any camera. Please check your camera connection.")
                # Return an error frame instead of crashing
                error_frame = create_error_frame("Camera not available")
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + error_frame + b'\r\n')
                return
        
        score_data = get_scoring_data(exercise_type)
        print(f"Video feed started for exercise: {exercise_type}")
        
        # Set camera properties for better stability
        cap.set(cv.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv.CAP_PROP_FPS, 30)

        frame_count = 0
        while not shutdown_flag:
            try:
                hasFrame, frame = cap.read()
                if not hasFrame:
                    print("Warning: Could not read frame from camera")
                    # Don't break, try to continue
                    time.sleep(0.1)
                    continue

                # Resize frame as per requirements
                inWidth, inHeight = 368, 368
                try:
                    blob = cv.dnn.blobFromImage(
                        frame, 1.0, (inWidth, inHeight), (127.5, 127.5, 127.5), swapRB=True, crop=False
                    )
                    net.setInput(blob)
                    out = net.forward()
                    out = out[:, :22, :, :]
                except Exception as e:
                    print(f"Error in neural network inference: {e}")
                    import traceback
                    traceback.print_exc()
                    time.sleep(0.1)
                    continue

                frameWidth, frameHeight = frame.shape[1], frame.shape[0]
                points = []

                for i in range(len(BODY_PARTS)):
                    heatMap = out[0, i, :, :]
                    _, conf, _, point = cv.minMaxLoc(heatMap)
                    x = (frameWidth * point[0]) / out.shape[3]
                    y = (frameHeight * point[1]) / out.shape[2]
                    points.append((int(x), int(y)) if conf > 0.2 else None)

                # Check form based on exercise type
                form_ok = False
                feedback_text = []
                if exercise_type != "none":
                    form_ok, feedback_text = check_exercise_form(exercise_type, points, frame)
                else:
                    # No exercise selected - just show pose
                    form_ok = True

                # Determine border color
                if form_ok:
                    border_color = (0, 255, 0)  # Green
                    score_data['green_border_count'] += 1
                else:
                    border_color = (0, 0, 255)  # Red
                    score_data['red_border_count'] += 1

                cv.rectangle(frame, (0, 0), (frameWidth - 1, frameHeight - 1), border_color, 10)

                # Update score every 5 seconds
                current_time = time.time()
                if current_time - score_data['last_score_time'] >= 5:
                    if score_data['green_border_count'] > score_data['red_border_count']:
                        score_data['current_score'] += 1
                    print(f"[{exercise_type}] Score Update: {score_data['current_score']} (Green: {score_data['green_border_count']}, Red: {score_data['red_border_count']})")
                    score_data['green_border_count'] = 0
                    score_data['red_border_count'] = 0
                    score_data['last_score_time'] = current_time

                # Display exercise name and score
                exercise_display = exercise_type.replace("_", " ").title() if exercise_type != "none" else "No Exercise Selected"
                cv.putText(
                    frame,
                    f"Exercise: {exercise_display}",
                    (10, 30),
                    cv.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )
                cv.putText(
                    frame,
                    f"Score: {score_data['current_score']}",
                    (10, 60),
                    cv.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

                # Draw the body parts and connections
                for pair in POSE_PAIRS:
                    partFrom, partTo = pair[0], pair[1]
                    idFrom, idTo = BODY_PARTS[partFrom], BODY_PARTS[partTo]

                    if points[idFrom] and points[idTo]:
                        cv.line(frame, points[idFrom], points[idTo], (0, 255, 0), 3)
                        cv.ellipse(frame, points[idFrom], (3, 3), 0, 0, 360, (0, 0, 255), cv.FILLED)
                        cv.ellipse(frame, points[idTo], (3, 3), 0, 0, 360, (0, 0, 255), cv.FILLED)

                # Encode the frame as JPEG
                ret, buffer = cv.imencode('.jpg', frame)
                if not ret:
                    print("Warning: Failed to encode frame")
                    continue
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
                frame_count += 1
                # Add a small delay to prevent overwhelming the system
                time.sleep(0.033)  # ~30 FPS
                
            except GeneratorExit:
                # Client disconnected, clean up
                print("Client disconnected from video feed")
                break
            except Exception as e:
                print(f"Error processing frame: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(0.1)
                continue
                
    except Exception as e:
        print(f"ERROR in generate_frames: {e}")
        import traceback
        traceback.print_exc()
        # Try to send an error frame
        try:
            error_frame = create_error_frame(f"Error: {str(e)}")
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + error_frame + b'\r\n')
        except:
            pass
    finally:
        # Clean up camera
        if cap is not None:
            cap.release()
            print("Camera released")

@app.route('/video-feed')
def video_feed():
    # Get exercise type from query parameter, default to "none"
    exercise_type = request.args.get('exercise', 'none')
    print(f"Video feed requested for exercise: {exercise_type}")
    try:
        return Response(
            generate_frames(exercise_type), 
            mimetype='multipart/x-mixed-replace; boundary=frame',
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        )
    except Exception as e:
        print(f"ERROR in video_feed route: {e}")
        import traceback
        traceback.print_exc()
        return f"Error: {str(e)}", 500

if __name__ == "__main__":
    try:
        print("Starting OpenPose server...")
        print("Server will run on http://localhost:5001")
        print("Press Ctrl+C to stop the server")
        # Use threaded=False to avoid potential threading issues on macOS
        # use_reloader=False prevents issues with double initialization
        app.run(port=5001, debug=False, threaded=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"Error starting server: {e}")
        import traceback
        traceback.print_exc()
