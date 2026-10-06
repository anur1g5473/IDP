# VIT Underpass Automated AI Traffic Controller

### *Intelligent Real-Time Traffic Management, Vision Telemetry & 3D Digital Twin*

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![YOLO](https://img.shields.io/badge/YOLO-v11n-FF6B35?style=for-the-badge)](https://ultralytics.com)
[![Three.js](https://img.shields.io/badge/Three.js-0.186-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![ESP32](https://img.shields.io/badge/ESP32-Firmware-E7352C?style=for-the-badge&logo=espressif&logoColor=white)](https://espressif.com)
[![License](https://img.shields.io/badge/License-MIT-A8D5BA?style=for-the-badge)](LICENSE)

---

## Executive Summary

The **VIT Underpass Automated AI Traffic Controller** is an end-to-end, hardware-integrated intelligent traffic management system engineered specifically for single-lane bottleneck underpasses and corridor choke points. 

Using high-throughput **YOLO v11n** computer vision with **ByteTrack** multi-object tracking, the system continuously analyzes dual video feeds (Side A & Side B), extracts per-class vehicle counts, measures directional crossing rates (IN / OUT flow), and feeds live telemetry into an adaptive **Finite State Machine (FSM)** decision engine. 

The decision engine balances green-light allocation using weighted queue scoring, grants instant priority to emergency vehicles (ambulances), broadcasts live telemetry to a **Neo-Brutalist React 19 / Three.js 3D Digital Twin**, and physically drives real traffic signal lights via UART communication with an **ESP32 microcontroller** with hardware-enforced failsafe lockout.

---

## Table of Contents

1. [Key Features](#-key-features)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Hardware & Safety Systems](#-hardware--safety-systems)
5. [Backend Architecture](#-backend-architecture)
6. [Frontend UI & Digital Twin](#-frontend-ui--digital-twin)
7. [Calibration & AI Studio](#-calibration--ai-studio)
8. [API & WebSocket Specification](#-api--websocket-specification)
9. [Database Schema & Audit Logging](#-database-schema--audit-logging)
10. [Directory Structure](#-directory-structure)
11. [Installation & Setup](#-installation--setup)
12. [Running the Application](#-running-the-application)
13. [Testing & Benchmarking](#-testing--benchmarking)
14. [Troubleshooting & FAQ](#-troubleshooting--faq)
15. [Contributing](#-contributing)
16. [License](#-license)

---

## 🚀 Key Features

---

## 🏛 System Architecture

```
                                  CAMERA INPUTS
                                 ┌──────────────┐
                                 │ Side A & B   │
                                 │ Video / RTSP │
                                 └──────┬───────┘
                                        │
                                        ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │                     BACKEND COMPUTER VISION PIPELINE                     │
 │                                                                          │
 │   ┌────────────────────────┐         ┌────────────────────────┐         │
 │   │ Threaded Capture Loops │ ──────▶ │ YOLO v11n Inference    │         │
 │   │ (cv2.VideoCapture)     │         │ (ultralytics PyTorch)  │         │
 │   └────────────────────────┘         └───────────┬────────────┘         │
 │                                                  │                       │
 │                                                  ▼                       │
 │   ┌────────────────────────┐         ┌────────────────────────┐         │
 │   │ Directional Tripwires  │ ◀────── │ ByteTrack Association  │         │
 │   │ (IN / OUT Crossing)    │         │ & Polygon ROI Filter   │         │
 │   └───────────┬────────────┘         └────────────────────────┘         │
 │               │                                                          │
 │               ▼                                                          │
 │   ┌─────────────────────────────────────────────────────────┐            │
 │   │ Real-Time Telemetry Extractor (Counts, FPS, Latency)   │            │
 │   └────────────────────────────┬────────────────────────────┘            │
 └────────────────────────────────┼─────────────────────────────────────────┘
                                  │
                                  ▼
 ┌──────────────────────────────────────────────────────────────────────────┐
 │               SUPERVISORY FSM DECISION ENGINE (server.py)                │
 │                                                                          │
 │   ┌────────────────────────┐         ┌────────────────────────┐         │
 │   │ Weighted Queue Scoring │ ──────▶ │ 4-State Cycle Machine  │         │
 │   │ (Priority Algorithms)  │         │ (Green / Clearance)    │         │
 │   └────────────────────────┘         └───────────┬────────────┘         │
 │                                                  │                       │
 │               ┌──────────────────────────────────┴───────────────┐       │
 │               ▼                                                  ▼       │
 │   ┌────────────────────────┐                         ┌─────────────────┐ │
 │   │ SQLite Database Logger │                         │ ESP32 UART Bus  │ │
 │   │ (traffic_logs.db)      │                         │ (115200 Baud)   │ │
 │   └────────────────────────┘                         └────────┬────────┘ │
 └───────────────────────────────────────────────────────────────┼──────────┘
                                                                 │
                                 ┌───────────────────────────────┴────────┐
                                 ▼                                        ▼
 ┌───────────────────────────────────────────────┐  ┌───────────────────────┐
 │             REACT 19 FRONTEND UI              │  │  ESP32 MICROCONTROLLER│
 │                                               │  │                       │
 │  • WebSocket Telemetry at ~30 FPS             │  │  • Dual-Red Lockout   │
 │  • Three.js 3D Digital Twin Viewport          │  │  • 3s Watchdog Timer  │
 │  • Dual MJPEG Stream Displays                 │  │  • Manual Override    │
 │  • HTML5 Canvas Calibration & ROI Studio      │  │  • Relay / LED Drive  │
 │  • SQLite Audit Table with Search/Filters     │  │                       │
 └───────────────────────────────────────────────┘  └───────────────────────┘
```

---

## 🛠 Technology Stack

### Backend Core
- **Python 3.10+**: Core backend runtime environment.
- **FastAPI**: Asynchronous high-performance web framework serving REST endpoints and WebSockets.
- **Uvicorn**: Lightning-fast ASGI web server implementation.
- **Ultralytics YOLO v11n**: High-accuracy, low-latency object detection neural network.
- **PyTorch & Torchvision**: Tensor computation and GPU-accelerated neural inference with CUDA support.
- **OpenCV (cv2)**: Video stream decoding, geometric calculations, ROI masking, and frame annotation.
- **ByteTrack**: Motion-based multi-object tracking and trajectory persistence.
- **PySerial**: Robust serial communication interface for microcontroller telemetry.
- **SQLite3**: ACID-compliant zero-configuration database for traffic event logging.

### Frontend Dashboard
- **React 19**: Modern UI component library utilizing hooks and concurrent rendering features.
- **Vite 8**: Next-generation frontend build tooling and hot-module replacement (HMR).

---

## ⚡ Hardware & Safety Systems

Traffic control systems demand strict, uncompromising fail-safety. Even in the event of software failure, kernel panic, or communication loss, the physical hardware is engineered to guarantee zero dangerous signal states.

### 1. Dual-Red Hardware Lockout
The firmware (`firmware/esp32_traffic_controller.ino`) contains an autonomous validation check before any GPIO state change:
```cpp
void setSignals(bool a_red, bool a_yellow, bool a_green, 
                bool b_red, bool b_yellow, bool b_green) {
    // Hardware interlock: NEVER permit both green signals concurrently
    if (a_green && b_green) {
        a_green = false;
        b_green = false;
        a_red = true;
        b_red = true;
    }
    // Update GPIO pins...
}
```
If an anomalous state is commanded from the host, the microcontroller automatically forces **ALL RED**.

### 2. 3-Second Serial Watchdog Failsafe
The ESP32 continuously tracks the timestamp of the last valid serial state packet received from the host PC.
- If no packet is received for **3000 ms** (e.g. host application closed, USB disconnected, PC frozen), the firmware drops out of automatic mode and enters **Watchdog Fallback Mode**.
- In this mode, both Side A and Side B Red lamps flash alternately at 2 Hz to alert motorists that the automated control is temporarily degraded.

### 3. Physical Manual Guard Override Button
A physical pushbutton switch connected to **GPIO 4 (with internal pull-up resistor)** serves as an emergency stop.
- Pressing the physical button immediately overrides serial commands and locks both signals to **ALL RED**.
- Releases only when the button is disengaged.

### 4. ESP32 Pin Assignment & Wiring Matrix

| Signal Group | Lamp Color | ESP32 GPIO Pin | Connection Type | Description |
|---|---|---|---|---|
| **Side A (West)** | Red | `GPIO 18` | Digital Output | Active HIGH to Relay / Driver |
| **Side A (West)** | Yellow | `GPIO 19` | Digital Output | Active HIGH to Relay / Driver |
| **Side A (West)** | Green | `GPIO 21` | Digital Output | Active HIGH to Relay / Driver |
| **Side B (East)** | Red | `GPIO 22` | Digital Output | Active HIGH to Relay / Driver |
| **Side B (East)** | Yellow | `GPIO 23` | Digital Output | Active HIGH to Relay / Driver |
| **Side B (East)** | Green | `GPIO 25` | Digital Output | Active HIGH to Relay / Driver |
| **Emergency Button** | Input | `GPIO 4` | Pull-Up Input | Active LOW to Ground |
| **Host Interface** | USB UART | `TX/RX` | Serial (115200) | State payload transmission |

---

## 🔬 Backend Architecture

The backend is built around a non-blocking asynchronous pipeline designed to maintain 30+ FPS video processing while simultaneously executing FSM logic and database writes.

### 1. Computer Vision Engine (`src/detector.py`)
- **Model Ingestion**: Instantiates `ultralytics.YOLO` on CUDA device if available, falling back to CPU.
- **ROI Polygon Verification**: Uses `cv2.pointPolygonTest` against user-calibrated 2D polygon vertices. Any object centroid falling outside the polygon is ignored for queue calculations.
- **Directional Intersection Detection**: Uses the counter-clockwise cross-product algorithm (`ccw()` and `segments_intersect()`) to detect when a vehicle's motion trajectory vector crosses the calibrated tripwire.
- **Class-to-Color HUD Mapping**:
  - `Car`: Blue (`#0095FF`)
  - `Motorcycle`: Cyan (`#00CCFF`)
  - `Bus`: Coral Red (`#EB5757`)
  - `Truck`: Purple (`#9B51E0`)
  - `Auto-Rickshaw`: Gold (`#F2C94C`)
  - `Ambulance`: Crimson Red (`#FF0000`)
  - `Bicycle`: Lime Green (`#32CD32`)
  - `Pedestrian`: Gray (`#B4B4B4`)

### 2. Dual Stream Video Processor (`src/video_processor.py`)
- Executes a dedicated background daemon thread running `_process_loop()`.
- Reads synchronized frames from `cap_a` and `cap_b`.
- Automatic video loopback upon EOF (`CAP_PROP_POS_FRAMES = 0`) ensures continuous 24/7 simulation.
- Generates multipart MJPEG streams via Python generators (`yield b'--frame...'`) consumed directly by HTML `<img>` elements.
- Captures unannotated raw frame snapshots on demand for the Road Calibration Studio.

### 3. Weighted FSM Decision Engine (`src/decision_engine.py`)
The Finite State Machine governs corridor traffic allocation through a 4-state cycle:
```
           ┌───────────────────────────────────────────────┐
           ▼                                               │
 ┌───────────────────┐    min_green expired &     ┌───────────────────┐
 │   SIDE_A_GREEN    │ ─── Weight_B > 1.5*Weight_A ──▶│ ALL_RED_CLEARANCE │
 │ (A: GRN, B: RED)  │     OR max_green reached   │     (A to B)      │
 └───────────────────┘     OR Ambulance on Side B └─────────┬─────────┘
                                                            │ clearance_sec (4s)
                                                            ▼
 ┌───────────────────┐    min_green expired &     ┌───────────────────┐
 │ ALL_RED_CLEARANCE │◀── Weight_A > 1.5*Weight_B ───│   SIDE_B_GREEN    │
 │     (B to A)      │     OR max_green reached   │ (A: RED, B: GRN)  │

---

## 💻 Frontend UI & Digital Twin

The frontend application is built in React 19 with a custom Neo-Brutalist design language optimized for high-pressure control room monitoring.

### 1. Root Layout & Telemetry Listener (`App.jsx`)
- Establishes a persistent `WebSocket` connection to `/ws/telemetry`.
- Maintains global application state across all tabs: FSM decision state, vehicle queue counts, hardware connection status, and mode (`LIVE`, `MANUAL`, `EMERGENCY`).
- Renders global overlays: the full-screen Three.js particle canvas and the safety confirmation modal.

### 2. Dual Live Monitor & Command Center (`TabDualLive.jsx`)
- **Dual Camera Matrix**: Displays live, annotated MJPEG video streams from Side A and Side B cameras.
- **Signal Status Monitors (`SignalWidget.jsx`)**: Renders high-visibility virtual traffic lamps with CSS glow filters corresponding to active RED, AMBER, and GREEN states, alongside real-time `Queue`, `IN`, and `OUT` vehicle counts.
- **FSM State Pipeline (`FsmFlowWidget.jsx`)**: Visual step-by-step state tracker indicating the active cycle phase and elapsed stage timer.
- **Digital Twin Viewport (`DigitalTwin3D.jsx`)**: An interactive 3D scene built with Three.js showing road lanes, brutalist wireframe tunnel walls, and dynamically color-synced 3D signal light meshes.
- **Manual Control Console**: Quick-action buttons allowing operators to force Green on Side A/B, initiate Emergency All Red, or reset to automated AI scheduling.

### 3. Road Calibration & AI Studio (`TabCalibration.jsx`)
- **Interactive Canvas Surface**: Allows operators to select between Side A and Side B feeds, pull live camera snapshots, and interactively plot:
  - **ROI Polygon Zone**: Green fill with vertex markers defining the detection boundary.
  - **Incoming Counting Line**: Cyan line with start/end anchor points detecting ingress flow.
  - **Outgoing Counting Line**: Orange line with start/end anchor points detecting egress flow.
- **AI Hyperparameter Tuning**:
  - *Confidence Threshold Slider* (0.10 - 0.90)
  - *IoU NMS Threshold Slider* (0.20 - 0.80)
  - *Inference Resolution Selector* (480px, 640px, 800px, 1024px)
  - *BYTETrack Tracking Toggle*
  - *Active Vehicle Class Checkboxes*
- **Instant Hot-Reload**: Clicking **Save & Apply Calibration** sends the JSON payload to `/api/calibration/config`, updating the running detector in real time without downtime.

### 4. Single Media Test Analyzer (`TabSingleMedia.jsx`)
- Drag-and-drop file upload target for testing isolated images or video recordings.

---

## 📡 API & WebSocket Specification

The FastAPI backend exposes an interactive OpenAPI Swagger interface accessible at `http://localhost:8000/docs`.

### WebSocket Stream: `/ws/telemetry`
Broadcasts structured JSON packets to connected clients at ~30 FPS:
```json
{
  "decision": {
    "fsm_state": "SIDE_A_GREEN",
    "signal_side_a": "GREEN",
    "signal_side_b": "RED",
    "elapsed_seconds": 12.4,
    "emergency_active": false,
    "manual_override": null
  },
  "side_a": {
    "counts": { "car": 3, "motorcycle": 2, "bus": 1 },
    "total_vehicles": 6,
    "incoming": 14,
    "outgoing": 10,
    "net_in_queue": 4,
    "has_emergency": false,
    "inference_ms": 23.4,
    "fps": 42.7
  },
  "side_b": {
    "counts": { "car": 1, "auto_rickshaw": 1 },
    "total_vehicles": 2,
    "incoming": 8,
    "outgoing": 7,
    "net_in_queue": 1,
    "has_emergency": false,
    "inference_ms": 21.8,
    "fps": 45.8
  },
  "hardware_connected": true,
  "dual_sim_active": true,
  "mode": "LIVE"
}
```

### REST Endpoints Reference

| HTTP Verb | Path | Request Body | Description |
|---|---|---|---|
| `GET` | `/` | — | Serves the production React SPA bundle (`index.html`) |
| `GET` | `/api/video_feed/a` | — | Multipart MJPEG video stream for Side A |
| `GET` | `/api/video_feed/b` | — | Multipart MJPEG video stream for Side B |
| `POST` | `/api/upload/single` | `multipart/form-data` (`file`) | Uploads single image/video for one-shot analysis |
| `POST` | `/api/upload/dual` | `multipart/form-data` (`file_a`, `file_b`) | Ingests two video files and initializes dual simulation |

---

## 🗄 Database Schema & Audit Logging

The system maintains an automated audit log stored in `traffic_logs.db`.

```sql
CREATE TABLE IF NOT EXISTS traffic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    fsm_state TEXT NOT NULL,
    side_a_signal TEXT NOT NULL,
    side_b_signal TEXT NOT NULL,
    side_a_count INTEGER NOT NULL,
    side_b_count INTEGER NOT NULL,
    side_a_details TEXT NOT NULL, -- JSON formatted vehicle distribution
    side_b_details TEXT NOT NULL, -- JSON formatted vehicle distribution
    emergency_flag INTEGER NOT NULL,
    manual_override TEXT
);
```

---

## 📁 Directory Structure

```
IDP/
├── README.md                          # Comprehensive project documentation
├── CONTRIBUTING.md                    # Contributor guide and standards
├── requirements.txt                   # Python backend dependencies
├── start.bat                          # Automated Windows launch script
├── yolo11n.pt                         # Pretrained YOLO v11n model weights
├── traffic_logs.db                    # SQLite audit database (auto-generated)
│
├── config/
│   └── calibration.json              # Active ROI polygons & AI configuration
│
├── configs/
│   ├── settings.json                 # Global timing & hardware port defaults
│   └── data.yaml                     # Custom YOLO dataset manifest
│
├── firmware/
│   └── esp32_traffic_controller.ino  # ESP32 C++ firmware with hardware lockout
│
├── scripts/
│   ├── run_demo.py                   # Server startup script
│   ├── train_yolo.py                 # Fine-tuning script for custom datasets
│   ├── evaluate.py                   # Performance and latency benchmark suite
│   ├── extract_frames.py             # Dataset frame extraction utility
│   └── run_baseline.py               # Baseline single-frame detection test
│
├── src/
│   ├── server.py                     # FastAPI REST API & WebSocket server
│   ├── detector.py                   # YOLO detector, ByteTrack & ROI engine
│   ├── video_processor.py            # Synchronized dual-stream video manager
│   ├── decision_engine.py            # 4-State weighted FSM traffic engine
│   ├── database.py                   # SQLite interface & query helpers
│   ├── serial_comm.py                # PySerial ESP32 UART communication bridge
│   └── templates/
│       └── index.html                # Fallback web template
│
├── frontend/                         # React 19 Frontend Application
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                  # React DOM entry point
│       ├── App.jsx                   # Root container & WebSocket listener
│       ├── theme.css                 # Neo-Brutalist CSS design system
│       └── components/
│           ├── Header.jsx            # Top HUD bar (Clock, Status, Theme, ECO)
│           ├── TabNav.jsx            # Navigation bar
│           ├── TabDualLive.jsx       # Dual live camera & 3D twin monitor
│           ├── TabSingleMedia.jsx    # Single image/video upload test bench
│           ├── TabCalibration.jsx    # Visual ROI & line calibration studio
│           ├── TabDatabaseLogs.jsx   # SQLite database audit log viewer
│           ├── SignalWidget.jsx      # Virtual traffic lamp & vehicle counters
│           ├── FsmFlowWidget.jsx     # Visual FSM state transition pipeline

---

## 💻 Installation & Setup

### Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher with `npm`
- **CUDA Toolkit** *(Recommended for GPU inference acceleration)*: NVIDIA Driver + CUDA 11.8 / 12.1
- **Hardware (Optional)**: ESP32 Dev Module connected via USB to `COM3`

### Step 1: Clone Repository & Create Virtual Environment
```bash
git clone https://github.com/your-org/vit-underpass-traffic.git
cd vit-underpass-traffic/IDP

# Create virtual environment
python -m venv venv

# Activate on Windows
.\\venv\\Scripts\\activate

# Activate on Linux/macOS
source venv/bin/activate
```

### Step 2: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Build the React 19 Frontend Bundle
```bash
cd frontend
npm install
npm run build
cd ..
```
*This compiles all React and Three.js components into `frontend/dist`, which FastAPI serves statically.*

---

## 🏃 Running the Application

### Option A: One-Click Launch (Windows)
Double-click `start.bat` in the project root. This script will:
1. Scan and terminate any orphaned processes listening on Port 8000.
2. Activate the Python virtual environment.
3. Automatically launch your default browser to `http://localhost:8000`.
4. Spin up the FastAPI backend and WebSocket server.

### Option B: Manual Command Line Launch
```bash
# Ensure virtual environment is activated
python scripts/run_demo.py
```
Open **`http://localhost:8000`** in your browser.

### Option C: Development Mode with Live Frontend Hot-Reload
```bash
# Terminal 1: Start FastAPI backend
python scripts/run_demo.py

# Terminal 2: Start Vite development server
cd frontend
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🧪 Testing & Benchmarking

### 1. Running Unit Tests
Execute the test suite to validate the FSM decision algorithms and mathematical queue weighting:
```bash
python -m unittest discover -s tests -v
```

### 2. Running Inference & Latency Benchmarks
Run the automated benchmark suite to evaluate PyTorch GPU performance and decision loop throughput across 100 consecutive frames:
```bash
python scripts/evaluate.py --frames 100
```
*Expected output:*
- **Average Inference Latency**: ~15-25 ms (GPU) / ~60-90 ms (CPU)
- **Vision Pipeline Throughput**: 40-60+ FPS (GPU)
- **FSM Evaluation Throughput**: >1,000,000 evaluations/sec (<0.001 ms per update)

---

## ❓ Troubleshooting & FAQ

#### Q: The browser displays "SIMULATION IDLE" or blank camera cards.
- **A**: Navigate to the **Dual Live & 3D Twin** tab, browse for `side_a_*.mp4` and `side_b_*.mp4` located in the `uploads/` directory, and click **Upload & Start Dual Simulation**.

#### Q: The hardware badge shows "HW: DISCONNECTED (SIMULATION)".
- **A**: This is expected if no physical ESP32 is plugged into USB. The backend automatically switches to simulated hardware mode. To connect real hardware, plug in the ESP32 and ensure the serial port in `src/server.py` matches your device manager (`COM3`, `/dev/ttyUSB0`, etc.).

#### Q: How do I change the vehicle detection zone?
- **A**: Navigate to the **Road Calibration & AI Studio** tab, select the camera feed, select the **ROI** tool, and click on the preview image to plot your custom polygon bounding vertices. Click **Save & Apply Calibration** to update immediately.

---

## 🤝 Contributing

We welcome contributions from developers, researchers, and traffic engineers! Please review our **[CONTRIBUTING.md](CONTRIBUTING.md)** document for full details regarding code style, pull request workflows, and component testing standards.

---

## 📄 License

This project is open-source under the **MIT License**. See the `LICENSE` file for details.

---

<div align="center">
  <sub>Built for the <strong>Vellore Institute of Technology (VIT) Underpass Corridor</strong>.</sub>
</div>

│           ├── DigitalTwin3D.jsx     # Three.js 3D underpass digital twin
│           ├── Background3D.jsx      # Three.js interactive particle background
│           └── ConfirmModal.jsx      # Safety confirmation modal dialog
│
└── tests/
    └── test_decision_engine.py       # PyUnit test suite for FSM algorithms
```

| `POST` | `/api/simulation/stop` | — | Terminates dual simulation and reverts to idle mode |
| `POST` | `/api/override/{mode}` | Path: `SIDE_A`, `SIDE_B`, `ALL_RED`, `RESET` | Enforces supervisory manual override command |
| `GET` | `/api/calibration/config` | — | Retrieves current calibration coordinates and AI parameters |
| `POST` | `/api/calibration/config` | JSON Configuration Schema | Updates ROI polygons, count lines, and YOLO parameters |
| `GET` | `/api/calibration/snapshot/{side}` | Path: `a` or `b` | Returns raw JPEG image snapshot from the specified camera |
| `GET` | `/api/logs` | Query: `limit=50` | Retrieves recent SQLite audit trail records and statistics |

- Instantly runs inference and displays the annotated image alongside latency benchmarks and a full per-class vehicle distribution summary.

### 5. SQLite Audit Log Viewer (`TabDatabaseLogs.jsx`)
- Real-time tabular audit trail displaying timestamps, FSM states, signal states, vehicle counts, emergency flags, and manual overrides.
- Features live text search and dropdown filters (All, Emergency, Manual Override, Specific FSM state).

### 6. Interactive 3D Background (`Background3D.jsx`)
- Full-screen WebGL particle field (2,500 particles) with a wireframe depth tunnel.
- Features mouse parallax tracking, automatic framerate throttling when the browser tab is hidden, an **ECO Mode** toggle, and dynamic color shifts to crimson red during emergency lockout events.

 └─────────┬─────────┘     OR Ambulance on Side A └───────────────────┘
           │ clearance_sec (4s)
           └───────────────────────────────────────────────▶
```

#### Mathematical Queue Weight Scoring Formula:
$$\text{Weight} = \sum_{c \in \text{classes}} \left( N_c \times W_c \right)$$
Where weights $W_c$ are assigned as:
- **Ambulance**: $100.0$ *(Instantaneous transition trigger)*
- **Bus / Heavy Truck**: $2.5$
- **Passenger Car**: $1.5$
- **Auto-Rickshaw**: $1.2$
- **Motorcycle / Scooter**: $0.8$
- **Bicycle**: $0.5$
- **Pedestrian**: $0.2$

- **Three.js**: WebGL-powered 3D rendering engine for the real-time Digital Twin and interactive particle background.
- **Lucide React**: Clean, modular icon suite.
- **HTML5 Canvas API**: Custom graphics rendering context for interactive polygon ROI and tripwire line authoring.
- **Vanilla CSS (Neo-Brutalist)**: Custom-tailored design system built with CSS variables, high-contrast borders, solid drop shadows, and responsive layout grids.

### Hardware & Microcontroller
- **Espressif ESP32 Dev Module**: 32-bit dual-core 240MHz microcontroller.
- **Arduino C++ Framework**: Low-latency firmware with hardware timer interrupts and serial parsing.


- **Dual-Camera Live Vision Stream**: Synchronous threaded ingestion and annotation of Side A and Side B video streams with MJPEG web delivery.
- **YOLO v11n Deep Learning Pipeline**: Real-time detection and classification across 8 classes (*Car, Motorcycle, Bus, Truck, Auto-Rickshaw, Ambulance, Bicycle, Pedestrian*).
- **ByteTrack Multi-Object Tracking**: Track trajectory lines over 30-frame rolling histories with unique ID assignment and intersection line collision counting.
- **Dynamic Polygon ROI Masking**: User-defined canvas-drawn Region of Interest (ROI) polygons to restrict vehicle detection to actual drivable lanes and suppress background noise.
- **Directional Tripwire Counting**: Normalized incoming and outgoing tripwire lines that track vehicle vectors to produce real-time `IN`, `OUT`, and `Queue` counts.
- **Weighted FSM Decision Engine**: Mathematical queue weight balancing (`Ambulance: 100x`, `Bus/Truck: 2.5x`, `Car: 1.5x`, `Auto: 1.2x`, `Motorcycle: 0.8x`, `Pedestrian: 0.2x`) with minimum green time, maximum green caps, and safety clearance transitions.
- **Emergency Priority Preemption**: Immediate preemption and transition to clearance state upon detection of emergency response vehicles.
- **Interactive 3D Digital Twin**: Real-time Three.js viewport displaying the virtual underpass geometry, vehicle queue blocks, and synchronized signal lamp glow.
- **Neo-Brutalist UI Dashboard**: High-contrast, accessibility-focused interface featuring live signal heads, manual overrides, telemetry metrics, and database audit logs.
- **Hardware-Enforced Failsafe**: ESP32 firmware equipped with dual-green hardware lockout, 3-second serial watchdog timer (auto-flash RED on host disconnect), and physical override button interrupt.
- **Hot-Reload Calibration Studio**: Web-based visual canvas to draw custom ROIs, place counting lines, and adjust confidence/IoU/resolution thresholds in real-time without restarting the backend.
- **SQLite Audit Trail**: Automatic logging of every state change, vehicle queue breakdown, and manual override event with full search and filter capabilities.
