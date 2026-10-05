import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import time
import argparse
import torch
import numpy as np
from src.detector import TrafficDetector
from src.decision_engine import TrafficDecisionEngine

def benchmark_inference(num_frames: int = 100):
    print("=" * 60)
    print("  VIT UNDERPASS - BENCHMARK & EVALUATION SUITE")
    print("=" * 60)
    print(f"[Device] PyTorch Version: {torch.__version__}")
    print(f"[Device] CUDA GPU Available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"[Device] GPU: {torch.cuda.get_device_name(0)}")

    detector = TrafficDetector()
    detector.load_model()

    dummy_frame = (np.random.rand(480, 640, 3) * 255).astype('uint8')
    print("\n[GPU Warmup] Warming up CUDA kernels...")
    for _ in range(5):
        detector.detect_frame(dummy_frame)

    print(f"\n[Benchmarking] Running {num_frames} frames through inference engine...")
    latencies = []
    for _ in range(num_frames):
        _, telemetry = detector.detect_frame(dummy_frame)
        latencies.append(telemetry["inference_ms"])

    avg_ms = np.mean(latencies)
    std_ms = np.std(latencies)
    fps = 1000.0 / avg_ms

    print("\n--- BENCHMARK RESULTS ---")
    print(f"Average Inference Latency : {avg_ms:.2f} ms")
    print(f"Latency Standard Dev      : {std_ms:.2f} ms")
    print(f"Throughput (FPS)          : {fps:.1f} FPS")
    print("-------------------------")

    print("\n[Testing FSM Logic Latency] Updating Finite State Machine 10,000 times...")
    engine = TrafficDecisionEngine()
    telemetry_a = {"counts": {"car": 3, "bus": 1}, "has_emergency": False}
    telemetry_b = {"counts": {"motorcycle": 2}, "has_emergency": False}

    fsm_start = time.time()
    for _ in range(10000):
        engine.update(telemetry_a, telemetry_b)
    fsm_duration = (time.time() - fsm_start) * 1000.0

    print(f"10,000 FSM Updates Time  : {fsm_duration:.2f} ms")
    print(f"Avg Latency per FSM Update: {fsm_duration / 10000.0:.4f} ms")
    print("==========================================================")

def main():
    parser = argparse.ArgumentParser(description="Evaluate Traffic Controller Performance")
    parser.add_argument("--frames", type=int, default=100, help="Number of benchmark frames")
    args = parser.parse_args()

    benchmark_inference(args.frames)

if __name__ == "__main__":
    main()

