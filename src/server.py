import os
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.decision_engine import TrafficDecisionEngine
from src.serial_comm import ESP32SerialBridge

app = FastAPI(title="VIT Underpass Traffic Supervisory Terminal")

decision_engine = TrafficDecisionEngine(min_green_sec=10, max_green_sec=45, clearance_sec=4)
serial_bridge = ESP32SerialBridge(port="COM3", baud_rate=115200)

templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

active_websockets: list[WebSocket] = []

@app.on_event("startup")
async def startup_event():
    serial_bridge.connect()

@app.get("/", response_class=HTMLResponse)
async def get_dashboard(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            side_a_sim = {"counts": {"car": 2, "motorcycle": 1}, "has_emergency": False}
            side_b_sim = {"counts": {"bus": 1}, "has_emergency": False}

            status = decision_engine.update(side_a_sim, side_b_sim)
            serial_bridge.send_state(status["fsm_state"])

            payload = {
                "decision": status,
                "side_a": side_a_sim,
                "side_b": side_b_sim,
                "hardware_connected": serial_bridge.connected
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        active_websockets.remove(websocket)

@app.post("/api/override/{mode}")
async def set_override(mode: str):
    if mode.upper() == "RESET":
        decision_engine.manual_override = None
    elif mode.upper() in ["SIDE_A", "SIDE_B", "ALL_RED"]:
        decision_engine.manual_override = mode.upper()
    return {"status": "ok", "override": decision_engine.manual_override}
