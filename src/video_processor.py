import os
import cv2
import time
import json
import threading
import numpy as np
from src.detector import TrafficDetector

class DualVideoProcessor:
    def __init__(self, detector: TrafficDetector):
        self.detector = detector
        self.side_a_path = None
        self.side_b_path = None
        self.is_running = False
        
        self.cap_a = None
        self.cap_b = None
        
        self.latest_frame_a = None
        self.latest_frame_b = None
        self.raw_frame_a = None
        self.raw_frame_b = None
        
        self.latest_telemetry_a = {"counts": {"car": 0}, "has_emergency": False, "total_vehicles": 0, "incoming": 0, "outgoing": 0, "net_in_queue": 0, "fps": 0.0}
        self.latest_telemetry_b = {"counts": {"car": 0}, "has_emergency": False, "total_vehicles": 0, "incoming": 0, "outgoing": 0, "net_in_queue": 0, "fps": 0.0}
        
        self.lock = threading.Lock()
        self.thread = None

    def start_dual_simulation(self, video_a_path: str, video_b_path: str):
        self.stop_dual_simulation()
        
        self.side_a_path = video_a_path
        self.side_b_path = video_b_path
        self.is_running = True
        
        self.detector.reset_stream_counts("side_a")
        self.detector.reset_stream_counts("side_b")

        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()
        print(f"[VideoProcessor] Started dual video simulation: Side A='{video_a_path}', Side B='{video_b_path}'")

    def stop_dual_simulation(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2.0)
        
        if self.cap_a:
            self.cap_a.release()
            self.cap_a = None
        if self.cap_b:
            self.cap_b.release()
            self.cap_b = None
            
        self.latest_frame_a = None
        self.latest_frame_b = None
        print("[VideoProcessor] Dual video simulation stopped.")

    def _process_loop(self):
        self.cap_a = cv2.VideoCapture(self.side_a_path)
        self.cap_b = cv2.VideoCapture(self.side_b_path)
        
        while self.is_running:
            try:
                ret_a, frame_a = self.cap_a.read() if self.cap_a and self.cap_a.isOpened() else (False, None)
                ret_b, frame_b = self.cap_b.read() if self.cap_b and self.cap_b.isOpened() else (False, None)
                
                if not ret_a and self.cap_a:
                    self.cap_a.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret_a, frame_a = self.cap_a.read()
                    
                if not ret_b and self.cap_b:
                    self.cap_b.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret_b, frame_b = self.cap_b.read()

                if frame_a is not None:
                    ann_a, tel_a = self.detector.detect_frame(frame_a, stream_id="side_a")
                else:
                    ann_a, tel_a = self._create_placeholder("Side A Stream Ended"), self.latest_telemetry_a

                if frame_b is not None:
                    ann_b, tel_b = self.detector.detect_frame(frame_b, stream_id="side_b")
                else:
                    ann_b, tel_b = self._create_placeholder("Side B Stream Ended"), self.latest_telemetry_b

                with self.lock:
                    self.raw_frame_a = frame_a
                    self.raw_frame_b = frame_b
                    self.latest_frame_a = ann_a
                    self.latest_frame_b = ann_b
                    self.latest_telemetry_a = tel_a
                    self.latest_telemetry_b = tel_b
            except Exception as e:
                print(f"[VideoProcessor] Loop error: {e}")

            time.sleep(0.03)

    def _create_placeholder(self, text: str) -> np.ndarray:
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(img, text, (150, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        return img

    def get_mjpeg_stream(self, side: str):
        while True:
            with self.lock:
                frame = self.latest_frame_a if side.upper() == "A" else self.latest_frame_b

            if frame is None:
                frame = self._create_placeholder(f"No Active Stream for Side {side.upper()}")

            ret, jpeg = cv2.imencode('.jpg', frame)
            if not ret:
                time.sleep(0.05)
                continue

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')
            time.sleep(0.03)

    def get_snapshot_jpeg(self, side: str = "A") -> bytes:
        with self.lock:
            frame = self.raw_frame_a if side.upper() == "A" else self.raw_frame_b
            if frame is None:
                frame = self.latest_frame_a if side.upper() == "A" else self.latest_frame_b

        if frame is None:
            frame = self._create_placeholder(f"No Active Snapshot for Side {side.upper()}")

        ret, jpeg = cv2.imencode('.jpg', frame)
        if not ret:
            return b""
        return jpeg.tobytes()

    def process_single_image(self, image_path: str):
        img = cv2.imread(image_path)
        if img is None:
            return None, {"error": f"Could not load image at {image_path}"}
        
        annotated_img, telemetry = self.detector.detect_frame(img)
        
        out_dir = os.path.join(os.path.dirname(image_path), "processed")
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, os.path.basename(image_path))
        cv2.imwrite(out_path, annotated_img)
        
        return out_path, telemetry

    def process_single_video(self, video_path: str):
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return None, {"error": f"Could not open video file at {video_path}"}
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 1)
        target_frame = min(5, max(0, total_frames // 4))
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        
        ret, frame = cap.read()
        if not ret or frame is None:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            return None, {"error": "Could not extract frame from video"}

        annotated_img, telemetry = self.detector.detect_frame(frame)
        
        out_dir = os.path.join(os.path.dirname(video_path), "processed")
        os.makedirs(out_dir, exist_ok=True)
        base_name = os.path.splitext(os.path.basename(video_path))[0] + "_preview.jpg"
        out_path = os.path.join(out_dir, base_name)
        cv2.imwrite(out_path, annotated_img)
        
        return out_path, telemetry
