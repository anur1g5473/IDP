import sys
import os
import uvicorn

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def main():
    print("=" * 70)
    print("  VIT UNDERPASS - INTELLIGENT TRAFFIC MANAGEMENT CONTROL TERMINAL")
    print("=" * 70)
    print("  [System] Launching FastAPI Web Backend & Live UI Dashboard...")
    print("  [Web UI] Dashboard available at: http://localhost:8000")
    print("  [API]    Interactive Docs at:    http://localhost:8000/docs")
    print("  [Press Ctrl+C to stop server]")
    print("=" * 70)

    uvicorn.run("src.server:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()
