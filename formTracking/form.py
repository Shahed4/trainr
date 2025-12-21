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
    Extracts keypoints and torso Y.
    """
    if results is None or len(results) == 0:
        return None, None

    r = results[0]
    if r.keypoints is None or r.keypoints.xy is None:
        return None, None

    kpts = r.keypoints.xy
    if kpts.shape[0] == 0:
        return None, None

    # Get main person
    dets = r.boxes
    if dets is None or len(dets) == 0:
        return None, None

    scores = dets.conf.cpu().numpy()
    main_idx = int(scores.argmax())
    person_kpts = kpts[main_idx].cpu().numpy()

    def get_pt(idx):
        if idx < len(person_kpts) and person_kpts[idx][0] != 0 and person_kpts[idx][1] != 0:
            return person_kpts[idx]
        return None

    keypoints = {
        "l_sh": get_pt(5), "r_sh": get_pt(6),
        "l_el": get_pt(7), "r_el": get_pt(8),
        "l_hip": get_pt(11), "r_hip": get_pt(12)
    }

    # Calculate Torso Y (average of shoulders and hips)
    y_coords = []
    for k in keypoints.values():
        if k is not None:
            y_coords.append(k[1])

    if not y_coords:
        return None, None

    torso_y = float(np.mean(y_coords))
    return torso_y, keypoints


def draw_debug_overlay(frame, kpts, angle, threshold):
    """
    Draws the torso-to-arm lines and the calculated angle on the frame.
    """
    # Color based on threshold
    color = (0, 255, 0) if angle < threshold else (0, 0, 255)  # Green if good, Red if bad

    # Draw Left Side (if visible)
    if kpts['l_sh'] is not None and kpts['l_hip'] is not None and kpts['l_el'] is not None:
        cv2.line(frame, tuple(kpts['l_sh'].astype(int)), tuple(kpts['l_hip'].astype(int)), (255, 255, 0), 2)  # Torso
        cv2.line(frame, tuple(kpts['l_sh'].astype(int)), tuple(kpts['l_el'].astype(int)), color, 3)  # Arm

    # Draw Right Side (if visible)
    if kpts['r_sh'] is not None and kpts['r_hip'] is not None and kpts['r_el'] is not None:
        cv2.line(frame, tuple(kpts['r_sh'].astype(int)), tuple(kpts['r_hip'].astype(int)), (255, 255, 0), 2)
        cv2.line(frame, tuple(kpts['r_sh'].astype(int)), tuple(kpts['r_el'].astype(int)), color, 3)

    # Text overlay
    cv2.putText(frame, f"Angle: {int(angle)} deg", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    return frame


# ---------- Streamlit App ----------

st.set_page_config(page_title="AI Push-up Coach", page_icon="💪")
st.title("AI Push-up Coach 2.0 🏋️‍♂️")

# --- SIDEBAR CONTROLS ---
st.sidebar.header("Configuration")
flare_threshold = st.sidebar.slider(
    "Max Elbow Angle (Degrees)",
    min_value=45,
    max_value=90,
    value=75,
    help="Higher = more lenient. Lower = stricter form. >75 usually implies flaring."
)
st.sidebar.info("Tip: Adjust this slider until 'Good' reps are green and 'Bad' reps are red.")


@st.cache_resource
def load_model():
    return YOLO("yolov8n-pose.pt")


uploaded_file = st.file_uploader("Upload video (Front view best)", type=["mp4", "mov", "avi"])

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

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1

        # Metrics
        col1, col2 = st.columns(2)
        with col1:
            good_metric = st.empty()
        with col2:
            bad_metric = st.empty()

        good_count = 0
        bad_count = 0
        state = "up"
        min_y, max_y = None, None
        current_rep_angles = []

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
            current_y, kpts = get_pose_details(results)

            if current_y is None:
                continue

            # Auto-calibration of range
            if min_y is None: min_y = current_y
            if max_y is None: max_y = current_y
            min_y = min(min_y, current_y)
            max_y = max(max_y, current_y)

            # Define UP/DOWN thresholds
            range_span = max_y - min_y
            down_thresh = min_y + 0.6 * range_span
            up_thresh = min_y + 0.3 * range_span

            # Calculate Angle
            left_angle = 0
            right_angle = 0
            if kpts['l_sh'] is not None and kpts['l_hip'] is not None and kpts['l_el'] is not None:
                left_angle = calculate_angle(kpts['l_hip'], kpts['l_sh'], kpts['l_el'])
            if kpts['r_sh'] is not None and kpts['r_hip'] is not None and kpts['r_el'] is not None:
                right_angle = calculate_angle(kpts['r_hip'], kpts['r_sh'], kpts['r_el'])

            # Use max angle found to be safe, or average
            valid_angles = [a for a in [left_angle, right_angle] if a > 10]  # filter noise
            current_flare = np.mean(valid_angles) if valid_angles else 0

            # State Machine
            if state == "up" and current_y > down_thresh:
                state = "down"
                current_rep_angles = []

            if state == "down":
                if current_flare > 0:
                    current_rep_angles.append(current_flare)

                # Check for completion
                if current_y < up_thresh:
                    state = "up"
                    if current_rep_angles:
                        rep_max_flare = np.median(current_rep_angles)

                        # COMPARE AGAINST SLIDER THRESHOLD
                        if rep_max_flare > flare_threshold:
                            bad_count += 1
                        else:
                            good_count += 1

            # Draw Debug Lines on Frame
            debug_frame = draw_debug_overlay(frame.copy(), kpts, current_flare, flare_threshold)

            # Display
            # Convert BGR to RGB for Streamlit
            stframe.image(cv2.cvtColor(debug_frame, cv2.COLOR_BGR2RGB), channels="RGB", use_container_width=True)

            good_metric.markdown(f"### Good: {good_count}")
            bad_metric.markdown(f"### Bad: {bad_count}")

        cap.release()

        st.divider()
        st.write(f"**Analysis Complete.** Threshold used: {flare_threshold}°")
        if bad_count == 0 and good_count > 0:
            st.balloons()
            st.success("Perfect form! No flaring detected.")
        elif bad_count > 0:
            st.error(f"Detected {bad_count} reps with flared elbows (> {flare_threshold}°).")