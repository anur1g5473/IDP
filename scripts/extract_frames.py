import os
import argparse
import cv2

def extract_frames(video_path: str, output_dir: str, sample_interval_sec: float = 1.0):
    if not os.path.exists(video_path):
        print(f"[Error] Video file not found at: '{video_path}'")
        return

    os.makedirs(output_dir, exist_ok=True)
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    frame_stride = max(1, int(fps * sample_interval_sec))
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    frame_count = 0
    saved_count = 0

    print(f"[Extractor] Extracting frames from '{video_name}' (1 frame every {sample_interval_sec}s)...")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % frame_stride == 0:
            out_filename = f"{video_name}_frame_{saved_count:05d}.jpg"
            out_path = os.path.join(output_dir, out_filename)
            cv2.imwrite(out_path, frame)
            saved_count += 1

        frame_count += 1

    cap.release()
    print(f"[Success] Extracted {saved_count} frames to '{output_dir}'.")

def main():
    parser = argparse.ArgumentParser(description="VIT Underpass Frame Extractor")
    parser.add_argument("--video", type=str, required=True, help="Path to raw underpass video")
    parser.add_argument("--output", type=str, default="../../training/extracted_frames", help="Output directory")
    parser.add_argument("--interval", type=float, default=1.0, help="Frame extraction interval in seconds")
    args = parser.parse_args()

    extract_frames(args.video, args.output, args.interval)

if __name__ == "__main__":
    main()
