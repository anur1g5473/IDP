import os
import time
import json
import cv2
import torch
import numpy as np

CLASS_COLORS = {
    "car": (255, 149, 0),        # #0095FF (BGR: Orange/Blue)
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

CALIBRATION_CONFIG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config", "calibration.json"))

def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def segments_intersect(p1, p2, p3, p4):
    return ccw(p1, p3, p4) != ccw(p2, p3, p4) and ccw(p1, p2, p3) != ccw(p1, p2, p4)


class TrafficDetector:
    def __init__(self, model_path: str = "yolo11n.pt", conf_thresh: float = 0.40):
        self.model_path = model_path
        self.conf_thresh = conf_thresh
        self.model = None
        self.config = self._load_calibration_config()

        # Track history & counters per stream side
        self.track_history = {}      # { stream_id: { track_id: [(cx, cy), ...] } }
        self.counted_ids = {}        # { stream_id: { "incoming": set(), "outgoing": set() } }
        self.accumulated_counts = {} # { stream_id: { "incoming": int, "outgoing": int } }

    def _load_calibration_config(self) -> dict:
        if os.path.exists(CALIBRATION_CONFIG_PATH):
            try:
                with open(CALIBRATION_CONFIG_PATH, "r") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[Detector] Warning: Failed to load calibration config: {e}")
        
        return {
            "model": {
                "weights": self.model_path,
                "conf_thresh": self.conf_thresh,
                "iou_thresh": 0.45,
                "imgsz": 640,
                "tracker": "bytetrack.yaml",
                "enable_tracking": True,
                "active_classes": ["car", "motorcycle", "bicycle", "bus", "truck", "auto_rickshaw", "ambulance", "person"]
            },
            "side_a": {
                "roi_polygon": [[0.05, 0.15], [0.95, 0.15], [0.95, 0.95], [0.05, 0.95]],
                "incoming_line": [[0.10, 0.40], [0.90, 0.40]],
                "outgoing_line": [[0.10, 0.75], [0.90, 0.75]]
            },
            "side_b": {
                "roi_polygon": [[0.05, 0.15], [0.95, 0.15], [0.95, 0.95], [0.05, 0.95]],
                "incoming_line": [[0.10, 0.40], [0.90, 0.40]],
                "outgoing_line": [[0.10, 0.75], [0.90, 0.75]]
            }
        }

    def update_config(self, new_config: dict):
        self.config = new_config
        os.makedirs(os.path.dirname(CALIBRATION_CONFIG_PATH), exist_ok=True)
        try:
            with open(CALIBRATION_CONFIG_PATH, "w") as f:
                json.dump(new_config, f, indent=2)
            print("[Detector] Updated calibration configuration.")
        except Exception as e:
            print(f"[Detector] Failed to save configuration to disk: {e}")

        model_cfg = new_config.get("model", {})
        if "conf_thresh" in model_cfg:
            self.conf_thresh = float(model_cfg["conf_thresh"])
        if "weights" in model_cfg and model_cfg["weights"] != self.model_path:
            self.model_path = model_cfg["weights"]
            self.model = None

    def load_model(self):
        from ultralytics import YOLO
        print(f"[Detector] Loading YOLO model from '{self.model_path}'...")
        self.model = YOLO(self.model_path)
        print(f"[Detector] Model loaded successfully on device: {'CUDA GPU' if torch.cuda.is_available() else 'CPU'}")

    def reset_stream_counts(self, stream_id: str = None):
        if stream_id:
            self.track_history[stream_id] = {}
            self.counted_ids[stream_id] = {"incoming": set(), "outgoing": set()}
            self.accumulated_counts[stream_id] = {"incoming": 0, "outgoing": 0}
        else:
            self.track_history.clear()
            self.counted_ids.clear()
            self.accumulated_counts.clear()

    def detect_frame(self, frame: np.ndarray, stream_id: str = "side_a") -> tuple[np.ndarray, dict]:
        if self.model is None:
            self.load_model()

        if stream_id not in self.track_history:
            self.track_history[stream_id] = {}
            self.counted_ids[stream_id] = {"incoming": set(), "outgoing": set()}
            self.accumulated_counts[stream_id] = {"incoming": 0, "outgoing": 0}

        start_time = time.time()
        device = 0 if torch.cuda.is_available() else "cpu"

        model_cfg = self.config.get("model", {})
        conf = float(model_cfg.get("conf_thresh", self.conf_thresh))
        iou = float(model_cfg.get("iou_thresh", 0.45))
        imgsz = int(model_cfg.get("imgsz", 640))
        enable_tracking = model_cfg.get("enable_tracking", True)
        active_classes = set(model_cfg.get("active_classes", CLASS_COLORS.keys()))

        H, W = frame.shape[:2]

        side_cfg = self.config.get(stream_id if stream_id in ["side_a", "side_b"] else "side_a", {})
        roi_poly_norm = side_cfg.get("roi_polygon", [])
        inc_line_norm = side_cfg.get("incoming_line", [])
        out_line_norm = side_cfg.get("outgoing_line", [])

        roi_poly_pts = None
        if len(roi_poly_norm) >= 3:
            roi_poly_pts = np.array([[int(p[0] * W), int(p[1] * H)] for p in roi_poly_norm], np.int32)

        inc_line = [(int(inc_line_norm[0][0] * W), int(inc_line_norm[0][1] * H)),
                    (int(inc_line_norm[1][0] * W), int(inc_line_norm[1][1] * H))] if len(inc_line_norm) == 2 else None

        out_line = [(int(out_line_norm[0][0] * W), int(out_line_norm[0][1] * H)),
                    (int(out_line_norm[1][0] * W), int(out_line_norm[1][1] * H))] if len(out_line_norm) == 2 else None

        try:
            if enable_tracking:
                results = self.model.track(frame, persist=True, imgsz=imgsz, conf=conf, iou=iou, tracker="bytetrack.yaml", device=device, verbose=False)[0]
            else:
                results = self.model.predict(frame, imgsz=imgsz, conf=conf, iou=iou, device=device, verbose=False)[0]
        except Exception:
            results = self.model.predict(frame, imgsz=imgsz, conf=conf, iou=iou, device=device, verbose=False)[0]

        inference_time_ms = (time.time() - start_time) * 1000
        annotated_frame = frame.copy()

        if roi_poly_pts is not None:
            cv2.polylines(annotated_frame, [roi_poly_pts], isClosed=True, color=(180, 50, 180), thickness=2)
            cv2.putText(annotated_frame, "ROI ZONE", (roi_poly_pts[0][0] + 5, roi_poly_pts[0][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 50, 180), 1)

        if inc_line:
            cv2.line(annotated_frame, inc_line[0], inc_line[1], color=(255, 255, 0), thickness=2)
            cv2.putText(annotated_frame, "INCOMING LINE", (inc_line[0][0] + 5, inc_line[0][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 0), 1)

        if out_line:
            cv2.line(annotated_frame, out_line[0], out_line[1], color=(0, 165, 255), thickness=2)
            cv2.putText(annotated_frame, "OUTGOING LINE", (out_line[0][0] + 5, out_line[0][1] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 165, 255), 1)

        return self._process_detections(frame, annotated_frame, results, enable_tracking, active_classes, roi_poly_pts, inc_line, out_line, stream_id, inference_time_ms, H, W)
    def _process_detections(self, frame, annotated_frame, results, enable_tracking, active_classes, roi_poly_pts, inc_line, out_line, stream_id, inference_time_ms, H, W):
        counts = {cls_name: 0 for cls_name in CLASS_COLORS.keys()}
        boxes = results.boxes
        has_id = hasattr(boxes, 'id') and boxes.id is not None

        for idx, box in enumerate(boxes):
            cls_id = int(box.cls[0].item())
            box_conf = float(box.conf[0].item())
            track_id = int(boxes.id[idx].item()) if has_id else (idx + 1000)

            label = COCO_TO_VIT_MAP.get(cls_id, None)
            if label is None or label not in active_classes:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cx, cy = (x1 + x2) // 2, (y1 + y2) // 2

            if roi_poly_pts is not None:
                inside = cv2.pointPolygonTest(roi_poly_pts, (float(cx), float(cy)), False) >= 0
                if not inside:
                    cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (100, 100, 100), 1)
                    continue

            counts[label] += 1
            color = CLASS_COLORS.get(label, (0, 255, 0))

            if enable_tracking:
                if track_id not in self.track_history[stream_id]:
                    self.track_history[stream_id][track_id] = []

                history = self.track_history[stream_id][track_id]
                history.append((cx, cy))
                if len(history) > 30:
                    history.pop(0)

                for i in range(1, len(history)):
                    cv2.line(annotated_frame, history[i - 1], history[i], color, 2)

                if len(history) >= 2:
                    p_prev, p_curr = history[-2], history[-1]

                    if inc_line and track_id not in self.counted_ids[stream_id]["incoming"]:
                        if segments_intersect(p_prev, p_curr, inc_line[0], inc_line[1]):
                            self.counted_ids[stream_id]["incoming"].add(track_id)
                            self.accumulated_counts[stream_id]["incoming"] += 1
                            cv2.circle(annotated_frame, (cx, cy), 8, (255, 255, 0), -1)

                    if out_line and track_id not in self.counted_ids[stream_id]["outgoing"]:
                        if segments_intersect(p_prev, p_curr, out_line[0], out_line[1]):
                            self.counted_ids[stream_id]["outgoing"].add(track_id)
                            self.accumulated_counts[stream_id]["outgoing"] += 1
                            cv2.circle(annotated_frame, (cx, cy), 8, (0, 165, 255), -1)

            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            caption = f"#{track_id} {label.upper()} {box_conf:.2f}" if enable_tracking else f"{label.upper()} {box_conf:.2f}"
            
            (w, h), _ = cv2.getTextSize(caption, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            cv2.rectangle(annotated_frame, (x1, max(0, y1 - 18)), (x1 + w, max(0, y1)), color, -1)
            cv2.putText(annotated_frame, caption, (x1, max(12, y1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        fps = round(1000.0 / inference_time_ms, 1) if inference_time_ms > 0 else 0.0
        total_vehicles = sum(counts.values()) - counts["person"]
        inc_cnt = self.accumulated_counts[stream_id]["incoming"]
        out_cnt = self.accumulated_counts[stream_id]["outgoing"]

        hud_str = f"IN: {inc_cnt} | OUT: {out_cnt} | QUEUE: {total_vehicles}"
        (hw, hh), _ = cv2.getTextSize(hud_str, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
        cv2.rectangle(annotated_frame, (W - hw - 20, 10), (W - 10, 10 + hh + 12), (0, 0, 0), -1)
        cv2.rectangle(annotated_frame, (W - hw - 20, 10), (W - 10, 10 + hh + 12), (0, 255, 204), 1)
        cv2.putText(annotated_frame, hud_str, (W - hw - 14, 10 + hh + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 204), 2)

        telemetry = {
            "counts": counts,
            "total_vehicles": total_vehicles,
            "incoming": inc_cnt,
            "outgoing": out_cnt,
            "net_in_queue": max(0, inc_cnt - out_cnt),
            "has_emergency": counts["ambulance"] > 0,
            "inference_ms": round(inference_time_ms, 2),
            "fps": fps
        }

        return annotated_frame, telemetry
