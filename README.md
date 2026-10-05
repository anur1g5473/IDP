# Automatic VIT Underpass Traffic Controller

An intelligent traffic management and dynamic signal control system designed for the single-lane U-shaped underpass at VIT.

## Key Features
- **AI Vehicle Detection:** Fine-tuned YOLO nano model detecting Cars, Motorcycles, Buses, Trucks, Auto-rickshaws, Ambulances, and Pedestrians.
- **Dynamic Decision Engine:** Finite State Machine (FSM) allocating green time based on real-time queue length, max wait bounds, and safe clearance gaps.
- **Guard Control Terminal:** Web UI with 3D Underpass Twin (Three.js), live stream overlays, upload mode, and real-time logs.
- **Hardware Integration & Safety:** ESP32 signal controller with physical manual override and auto-fallback watchdog.

## Folder Structure
- `src/`: Core Python modules (Detection Engine, Decision Logic, Web Backend, Serial Comm).
- `firmware/`: ESP32 Arduino C++ firmware.
- `scripts/`: Training, evaluation, frame extraction, and demo launcher.
- `configs/`: YAML and JSON configurations.
- `tests/`: Automated unit tests.

## Getting Started
1. Activate virtual environment: `.\venv\Scripts\Activate.ps1`
2. Install dependencies: `pip install -r requirements.txt`
3. Launch Web Terminal: `python scripts/run_demo.py`
