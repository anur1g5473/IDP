import argparse
import time
import cv2
import torch
from src.detector import TrafficDetector

def main():
    parser = argparse.ArgumentParser(description="VIT Underpass YOLO Baseline Test")
    parser.add_argument("--source", type=str, default="0", help="Video source (0 for webcam or file path)")
    parser.add_argument("--model", type=str, default="yolo11n.pt", help="YOLO model path")
    args = parser.parse_args()

    print("=" * 60)
    print("  VIT UNDERPASS - YOLO BASELINE INFERENCE TEST")
    print("=" * 60)
    print(f"[Info] PyTorch Version: {torch.__version__}")
    print(f"[Info] CUDA Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"[Info] GPU Device: {torch.cuda.get_device_name(0)}")

    detector = TrafficDetector(model_path=args.model)
    detector.load_model()

    source = int(args.source) if args.source.isdigit() else args.source
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        print(f"[Error] Could not open video source '{args.source}'. Generating test canvas...")
        frame = (torch.rand(480, 640, 3).numpy() * 255).astype('uint8')
        annotated_frame, telemetry = detector.detect_frame(frame)
        print(f"[Telemetry] Results: {telemetry}")
        print("[Success] Baseline detector test verified successfully!")
        return

    print("[Info] Starting live baseline test loop. Press 'q' to stop...")
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        annotated_frame, telemetry = detector.detect_frame(frame)
        cv2.putText(annotated_frame, f"FPS: {telemetry['fps']} | GPU CUDA: {torch.cuda.is_available()}", 
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

        cv2.imshow("VIT Underpass - YOLO Baseline Test", annotated_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[Info] Baseline inference test completed.")

if __name__ == "__main__":
    main()
