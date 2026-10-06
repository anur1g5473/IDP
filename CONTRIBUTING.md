# Contributing to VIT Underpass Automated AI Traffic Controller

Thank you for your interest in contributing to the **VIT Underpass Automated AI Traffic Controller** project! This document outlines our development process, code standards, and guidelines for submitting bug reports, features, and pull requests.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How Can I Contribute?](#how-can-i-contribute)
3. [Development Environment Setup](#development-environment-setup)
4. [Branching & Git Workflow](#branching--git-workflow)
5. [Backend Guidelines (Python & FastAPI)](#backend-guidelines-python--fastapi)
6. [Frontend Guidelines (React 19 & Three.js)](#frontend-guidelines-react-19--threejs)
7. [Hardware & Firmware Guidelines (ESP32)](#hardware--firmware-guidelines-esp32)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Submitting a Pull Request (PR)](#submitting-a-pull-request-pr)

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please be respectful, constructive, and collaborative in all project discussions, issue trackers, and code reviews.

---

## 💡 How Can I Contribute?

- **Report Bugs**: Open an issue detailing steps to reproduce, expected vs. actual behavior, OS, and log traces.
- **Suggest Enhancements**: Propose improvements to vehicle tracking algorithms, FSM scheduling logic, UI responsiveness, or 3D visuals.
- **Improve Documentation**: Help refine setup guides, API schemas, and architecture diagrams.
- **Submit Code**: Implement features or bug fixes directly via Pull Requests.

---

## 🛠 Development Environment Setup

### 1. Fork & Clone
```bash
git clone https://github.com/<your-username>/vit-underpass-traffic.git
cd vit-underpass-traffic/IDP
```

### 2. Python Virtual Environment
```bash
python -m venv venv
# Windows:
.\\venv\\Scripts\\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 🐍 Backend Guidelines (Python & FastAPI)

1. **PEP 8 Compliance**: Use 4 spaces for indentation, meaningful variable names, and clear type hints (`typing.Optional`, `typing.Dict`).
2. **Thread Safety**: Any shared state between the video loop and FastAPI request handlers must be guarded by `threading.Lock()`.
3. **Graceful Degradation**: Microcontroller communication (`src/serial_comm.py`) must never crash the server if hardware disconnects. Always provide automated simulation fallback.
4. **Coordinate Normalization**: All ROI polygons and counting lines must store coordinates as normalized floats (0.0 - 1.0) to guarantee resolution independence.
5. **No Hardcoded Paths**: Always use `os.path.abspath` and relative joins from `__file__`.

---

## ⚛️ Frontend Guidelines (React 19 & Three.js)

1. **Neo-Brutalist Theme Consistency**:
   - Utilize existing CSS variables defined in `src/theme.css` (`var(--royal-plum)`, `var(--mint-mist)`, `var(--signal-red)`, etc.).
   - Ensure all interactive buttons adopt `.btn-brutal` styles with high-contrast borders and solid offset drop shadows.
2. **Three.js Memory Management**:
   - Always dispose of geometries (`geometry.dispose()`), materials (`material.dispose()`), and textures when components unmount.
   - Cancel `requestAnimationFrame` IDs in the `useEffect` cleanup return callback to prevent WebGL memory leaks.
3. **No String Template Literals for Dynamic ClassNames**:
   - To avoid parser issues across diverse JavaScript toolchains, prefer standard string concatenation (e.g. `'btn-brutal ' + (isActive ? 'btn-mint' : 'btn-secondary')`).
4. **WebSocket Performance**:
   - Limit state updates to avoid unnecessary high-frequency re-renders. Use local refs for high-rate visual canvas mutations.

---

## ⚡ Hardware & Firmware Guidelines (ESP32)

1. **Fail-Safe Principle**: The firmware in `firmware/esp32_traffic_controller.ino` must prioritize safety above all else. Under no circumstance should `a_green` and `b_green` be driven HIGH simultaneously.
2. **Watchdog Maintenance**: Ensure `WATCHDOG_TIMEOUT_MS` (3000ms) is maintained. If new commands are introduced, reset `lastPacketTime = millis();` upon reception.
3. **Hardware Debouncing**: Any new physical input switches must incorporate digital or hardware debouncing.

---

## 🧪 Testing & Quality Assurance

Before submitting a Pull Request, run the following verification checks:

### 1. Python Unit Tests
```bash
python -m unittest discover -s tests -v
```

### 2. Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 🚀 Submitting a Pull Request (PR)

1. Push your branch to your GitHub fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Provide a clear, descriptive PR title and complete summary of changes and testing done.

---

<div align="center">
  <sub>Thank you for contributing to the <strong>VIT Underpass Automated AI Traffic Controller</strong>!</sub>
</div>


---

## 🌿 Branching & Git Workflow

We follow standard GitHub flow. Always branch from `main`:

```bash
# Feature branch
git checkout -b feat/tripwire-velocity-estimation

# Bugfix branch
git checkout -b fix/mjpeg-stream-leak
```

### Commit Message Conventions
We follow conventional commit format:
- `feat: add adaptive starvation timer to FSM decision engine`
- `fix: correct frame buffer lock in dual video processor`
- `docs: update hardware schematic and pinout table in README`
- `refactor: optimize Three.js geometry memory allocation in DigitalTwin3D`
- `test: add unit test coverage for ambulance emergency override`
