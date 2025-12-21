import os
import tempfile
import cv2
import numpy as np
import streamlit as st
from ultralytics import YOLO


# ---------- Helper Functions ----------

def calculate_angle(a, b, c):
    """
    Calculates the angle at point b (vertex) formed by a and c.
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    norm_ba = np.linalg.norm(ba)
    norm_bc = np.linalg.norm(bc)

    if norm_ba == 0 or norm_bc == 0:
        return 0.0

    cosine_angle = np.dot(ba, bc) / (norm_ba * norm_bc)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)

    angle = np.arccos(cosine_angle)
    return np.degrees(angle)


def get_pose_details(results):
    """
    Extracts keypoints for pull-up analysis.
    Returns: head_y, shoulder_y, keypoints dict
    """
    if results is None or len(results) == 0:
        return None, None, None

    r = results[0]
    if r.keypoints is None or r.keypoints.xy is None:
        return None, None, None

    kpts = r.keypoints.xy
    if kpts.shape[0] == 0:
        return None, None, None

    # Get main person
    dets = r.boxes
    if dets is None or len(dets) == 0:
        return None, None, None

    scores = dets.conf.cpu().numpy()
    main_idx = int(scores.argmax())
    person_kpts = kpts[main_idx].cpu().numpy()

    def get_pt(idx):
        if idx < len(person_kpts) and person_kpts[idx][0] != 0 and person_kpts[idx][1] != 0:
            return person_kpts[idx]
        return None

    # COCO keypoint indices: 0=nose, 5=l_shoulder, 6=r_shoulder, 7=l_elbow, 8=r_elbow, 11=l_hip, 12=r_hip
    keypoints = {
        "nose": get_pt(0),
        "l_sh": get_pt(5), "r_sh": get_pt(6),
        "l_el": get_pt(7), "r_el": get_pt(8),
        "l_hip": get_pt(11), "r_hip": get_pt(12)
    }

    # Calculate head Y (use nose as proxy for chin/head position)
    # Calculate shoulder Y (average of both shoulders)
    head_y = None
    if keypoints["nose"] is not None:
        head_y = float(keypoints["nose"][1])
    
    shoulder_y = None
    shoulder_coords = []
    if keypoints["l_sh"] is not None:
        shoulder_coords.append(keypoints["l_sh"][1])
    if keypoints["r_sh"] is not None:
        shoulder_coords.append(keypoints["r_sh"][1])
    
    if shoulder_coords:
        shoulder_y = float(np.mean(shoulder_coords))

    return head_y, shoulder_y, keypoints


def draw_debug_overlay(frame, kpts, head_y, shoulder_y):
    """
    Draws visualization overlay showing head position relative to shoulders.
    """
    # Draw shoulder line
    if kpts['l_sh'] is not None and kpts['r_sh'] is not None:
        cv2.line(frame, tuple(kpts['l_sh'].astype(int)), tuple(kpts['r_sh'].astype(int)), (255, 255, 0), 2)
    
    # Draw head position indicator
    if kpts['nose'] is not None and shoulder_y is not None:
        # Draw line from nose to shoulder level
        nose_pos = tuple(kpts['nose'].astype(int))
        shoulder_x = int((kpts['l_sh'][0] + kpts['r_sh'][0]) / 2) if kpts['l_sh'] is not None and kpts['r_sh'] is not None else nose_pos[0]
        shoulder_pos = (shoulder_x, int(shoulder_y))
        
        # Color based on position
        head_above_shoulder = head_y < shoulder_y  # Lower Y = higher in image
        line_color = (0, 255, 0) if head_above_shoulder else (0, 0, 255)  # Green if above, red if below
        
        cv2.line(frame, nose_pos, shoulder_pos, line_color, 2)
        cv2.circle(frame, nose_pos, 5, (0, 255, 255), -1)
    
    # Text overlay
    if head_y is not None and shoulder_y is not None:
        head_above_shoulder = head_y < shoulder_y  # Lower Y = higher in image
        status = "CHIN ABOVE BAR" if head_above_shoulder else "CHIN BELOW BAR"
        color = (0, 255, 0) if head_above_shoulder else (0, 0, 255)
        cv2.putText(frame, status, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    
    return frame


# ---------- Streamlit App ----------

st.set_page_config(page_title="AI Pull-up Coach", page_icon="💪")
st.title("AI Pull-up Coach 🏋️‍♂️")

# --- SIDEBAR CONTROLS ---
st.sidebar.header("Configuration")
st.sidebar.info("**Standard:** Chin must go above the bar (head above shoulders) for a valid rep.")
st.sidebar.info("Side or rear view recommended for best results.")


@st.cache_resource
def load_model():
    return YOLO("yolov8n-pose.pt")


uploaded_file = st.file_uploader("Upload video (Side view recommended)", type=["mp4", "mov", "avi"])

if uploaded_file is not None:
    suffix = os.path.splitext(uploaded_file.name)[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(uploaded_file.read())
    tmp.close()
    video_path = tmp.name

    if st.button("Analyze Form"):
        model = load_model()
        cap = cv2.VideoCapture(video_path)

        # Setup for output video visualization
        stframe = st.empty()

        # Metrics
        col1, col2 = st.columns(2)
        with col1:
            good_metric = st.empty()
        with col2:
            total_metric = st.empty()

        good_count = 0
        total_reps = 0
        state = "down"  # Start in down position (dead hang)
        
        # Track range for calibration
        min_head_y = None  # Highest position (lowest Y value)
        max_head_y = None  # Lowest position (highest Y value)
        
        # Track if chin went above bar during current rep
        chin_above_bar = False

        frame_idx = 0
        FRAME_STRIDE = 3

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_idx += 1
            if frame_idx % FRAME_STRIDE != 0:
                continue

            # Inference
            results = model(frame, verbose=False)
            head_y, shoulder_y, kpts = get_pose_details(results)

            if head_y is None or shoulder_y is None or kpts is None:
                continue

            # Auto-calibration of range
            if min_head_y is None:
                min_head_y = head_y
                max_head_y = head_y
            
            min_head_y = min(min_head_y, head_y)
            max_head_y = max(max_head_y, head_y)

            # Check if chin is above bar (head above shoulders)
            head_above_shoulder = head_y < shoulder_y  # Lower Y = higher in image

            # Define UP/DOWN thresholds based on head position
            head_range = max_head_y - min_head_y
            if head_range > 0:
                # Top position: head significantly above shoulders
                top_thresh = min_head_y + 0.3 * head_range
                # Bottom position: head at or below shoulders
                bottom_thresh = min_head_y + 0.7 * head_range
            else:
                top_thresh = min_head_y
                bottom_thresh = max_head_y

            # State Machine
            if state == "down" and head_y < top_thresh:  # Head goes up (lower Y)
                state = "up"
                chin_above_bar = False  # Reset for new rep

            if state == "up":
                # Check if chin goes above bar during this rep
                if head_above_shoulder:
                    chin_above_bar = True

                # Check for completion (back down)
                if head_y > bottom_thresh:
                    state = "down"
                    total_reps += 1
                    
                    # Count as good if chin went above bar
                    if chin_above_bar:
                        good_count += 1

            # Draw Debug Lines on Frame
            debug_frame = draw_debug_overlay(frame.copy(), kpts, head_y, shoulder_y)

            # Display
            stframe.image(cv2.cvtColor(debug_frame, cv2.COLOR_BGR2RGB), channels="RGB", use_container_width=True)

            good_metric.markdown(f"### ✅ Valid Reps: {good_count}")
            total_metric.markdown(f"### 📊 Total Reps: {total_reps}")

        cap.release()

        st.divider()
        st.write(f"**Analysis Complete.**")
        st.write(f"**Standard:** Chin above bar (head above shoulders)")
        st.write(f"- ✅ Valid reps (chin above bar): {good_count}")
        st.write(f"- 📊 Total reps detected: {total_reps}")
        
        if total_reps > 0:
            invalid_count = total_reps - good_count
            if invalid_count == 0:
                st.balloons()
                st.success(f"Perfect! All {good_count} reps had chin above bar.")
            else:
                st.warning(f"{invalid_count} rep(s) did not reach chin above bar.")
        else:
            st.info("No reps detected. Make sure the video shows clear pull-up movements.")

