import time
import cv2
import torch
import numpy as np

CLASS_COLORS = {
    "car": (255, 149, 0),        # #0095FF
    "motorcycle": (255, 204, 0), # #00CCFF
    "bicycle": (50, 205, 50),    # Lime Green
    "bus": (235, 87, 87),        # Coral Red
    "truck": (155, 81, 224),     # Purple
    "auto_rickshaw": (242, 201, 76), # Gold
    "ambulance": (0, 0, 255),    # Crimson Red (Emergency)
    "person": (180, 180, 180)    # Gray
}

COCO_TO_VIT_MAP = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}

class TrafficDetector:
    def __init__(self, model_path: str = "yolo11n.pt", conf_thresh: float = 0.45):
        self.model_path = model_path
        self.conf_thresh = conf_thresh
        self.model = None

    def load_model(self):
        from ultralytics import YOLO
        print(f"[Detector] Loading YOLO model from '{self.model_path}'...")
        self.model = YOLO(self.model_path)
        print(f"[Detector] Model loaded successfully on device: {'CUDA GPU' if torch.cuda.is_available() else 'CPU'}")

    def detect_frame(self, frame: np.ndarray):
        if self.model is None:
            self.load_model()

        start_time = time.time()
        device = 0 if torch.cuda.is_available() else "cpu"
        results = self.model.predict(frame, conf=self.conf_thresh, device=device, verbose=False)[0]
        inference_time_ms = (time.time() - start_time) * 1000

        counts = {cls_name: 0 for cls_name in CLASS_COLORS.keys()}
        annotated_frame = frame.copy()

        for box in results.boxes:
            cls_id = int(box.cls[0].item())
            conf = float(box.conf[0].item())

            label = COCO_TO_VIT_MAP.get(cls_id, None)
            if label is None:
                continue

            counts[label] += 1

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            color = CLASS_COLORS.get(label, (0, 255, 0))

            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            caption = f"{label.upper()} {conf:.2f}"
            
            (w, h), _ = cv2.getTextSize(caption, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(annotated_frame, (x1, y1 - 20), (x1 + w, y1), color, -1)
            cv2.putText(annotated_frame, caption, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        fps = round(1000.0 / inference_time_ms, 1) if inference_time_ms > 0 else 0.0

        telemetry = {
            "counts": counts,
            "total_vehicles": sum(counts.values()) - counts["person"],
            "has_emergency": counts["ambulance"] > 0,
            "inference_ms": round(inference_time_ms, 2),
            "fps": fps
        }

        return annotated_frame, telemetry
