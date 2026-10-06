import os
import json
import asyncio
import shutil
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, UploadFile, File, Form, BackgroundTasks, Response
from fastapi.responses import HTMLResponse, StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from src.decision_engine import TrafficDecisionEngine
from src.serial_comm import ESP32SerialBridge
from src.detector import TrafficDetector
from src.video_processor import DualVideoProcessor
from src.database import init_db, log_traffic_event, get_recent_logs, get_db_stats

app = FastAPI(title="VIT Underpass Intelligent Traffic Supervisory Terminal")

BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "uploads"))
FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

detector = TrafficDetector()
detector.load_model()

video_processor = DualVideoProcessor(detector=detector)
decision_engine = TrafficDecisionEngine(min_green_sec=10, max_green_sec=45, clearance_sec=4)
serial_bridge = ESP32SerialBridge(port="COM3", baud_rate=115200)

templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))
active_websockets: list[WebSocket] = []

current_mode = "LIVE"
single_test_result = None

@app.on_event("startup")
async def startup_event():
    init_db()
    serial_bridge.connect()

@app.get("/")
async def get_dashboard(request: Request):
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return templates.TemplateResponse(request=request, name="index.html")


@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    last_log_time = 0
    try:
        while True:
            if video_processor.is_running:
                side_a_tel = video_processor.latest_telemetry_a
                side_b_tel = video_processor.latest_telemetry_b
            else:
                side_a_tel = {"counts": {"car": 2, "motorcycle": 1}, "has_emergency": False, "total_vehicles": 3, "incoming": 12, "outgoing": 9, "net_in_queue": 3}
                side_b_tel = {"counts": {"bus": 1}, "has_emergency": False, "total_vehicles": 1, "incoming": 8, "outgoing": 7, "net_in_queue": 1}

            status = decision_engine.update(side_a_tel, side_b_tel)
            serial_bridge.send_state(status["fsm_state"])

            now = asyncio.get_event_loop().time()
            if now - last_log_time >= 3.0:
                log_traffic_event(
                    fsm_state=status["fsm_state"],
                    side_a_signal=status["signal_side_a"],
                    side_b_signal=status["signal_side_b"],
                    side_a_count=side_a_tel.get("total_vehicles", 0),
                    side_b_count=side_b_tel.get("total_vehicles", 0),
                    side_a_details=json.dumps(side_a_tel.get("counts", {})),
                    side_b_details=json.dumps(side_b_tel.get("counts", {})),
                    emergency_flag=status["emergency_active"],
                    manual_override=decision_engine.manual_override
                )
                last_log_time = now

            payload = {
                "decision": status,
                "side_a": side_a_tel,
                "side_b": side_b_tel,
                "hardware_connected": serial_bridge.connected,
                "mode": current_mode,
                "dual_sim_active": video_processor.is_running
            }

            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        active_websockets.remove(websocket)

@app.get("/api/video_feed/{side}")
async def video_feed(side: str):
    return StreamingResponse(
        video_processor.get_mjpeg_stream(side),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.post("/api/upload/single")
async def upload_single_media(file: UploadFile = File(...)):
    global current_mode, single_test_result
    current_mode = "SINGLE_TEST"
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext in ['.jpg', '.jpeg', '.png', '.bmp', '.webp']:
        processed_path, telemetry = video_processor.process_single_image(file_path)
        if processed_path is None:
            return JSONResponse({"status": "error", "message": telemetry.get("error", "Processing failed")}, status_code=400)
        
        rel_path = f"/uploads/processed/{os.path.basename(file_path)}"
        single_test_result = {
            "type": "image",
            "url": rel_path,
            "telemetry": telemetry
        }
        return JSONResponse({"status": "ok", "result": single_test_result})
    else:
        processed_path, telemetry = video_processor.process_single_video(file_path)
        if processed_path is None:
            return JSONResponse({"status": "error", "message": telemetry.get("error", "Processing failed")}, status_code=400)
        
        rel_img_path = f"/uploads/processed/{os.path.basename(processed_path)}"
        rel_vid_path = f"/uploads/{file.filename}"
        single_test_result = {
            "type": "video",
            "url": rel_img_path,
            "video_url": rel_vid_path,
            "filename": file.filename,
            "telemetry": telemetry
        }
        return JSONResponse({"status": "ok", "result": single_test_result})

@app.post("/api/upload/dual")
async def upload_dual_videos(file_a: UploadFile = File(...), file_b: UploadFile = File(...)):
    global current_mode
    current_mode = "DUAL_TEST"
    
    path_a = os.path.join(UPLOAD_DIR, f"side_a_{file_a.filename}")
    path_b = os.path.join(UPLOAD_DIR, f"side_b_{file_b.filename}")

    with open(path_a, "wb") as buffer:
        shutil.copyfileobj(file_a.file, buffer)
    with open(path_b, "wb") as buffer:
        shutil.copyfileobj(file_b.file, buffer)

    video_processor.start_dual_simulation(path_a, path_b)

    return JSONResponse({
        "status": "ok",
        "message": "Dual video streams initialized successfully.",
        "side_a_feed": "/api/video_feed/a",
        "side_b_feed": "/api/video_feed/b"
    })

@app.post("/api/simulation/stop")
async def stop_simulation():
    global current_mode
    video_processor.stop_dual_simulation()
    current_mode = "LIVE"
    return {"status": "ok", "message": "Simulation stopped, returned to live mode."}

@app.post("/api/override/{mode}")
async def set_override(mode: str):
    import time
    if mode.upper() == "RESET":
        decision_engine.manual_override = None
    elif mode.upper() in ["SIDE_A", "SIDE_B", "ALL_RED"]:
        decision_engine.manual_override = mode.upper()
    decision_engine.state_start_time = time.time()
    return {"status": "ok", "override": decision_engine.manual_override}

@app.get("/api/calibration/config")
async def get_calibration_config():
    return JSONResponse(detector.config)

@app.post("/api/calibration/config")
async def update_calibration_config(request: Request):
    try:
        new_config = await request.json()
        detector.update_config(new_config)
        return JSONResponse({"status": "ok", "message": "Calibration updated successfully."})
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=400)

@app.get("/api/calibration/snapshot/{side}")
async def get_calibration_snapshot(side: str):
    jpeg_bytes = video_processor.get_snapshot_jpeg(side)
    if not jpeg_bytes:
        return JSONResponse({"status": "error", "message": "No frame snapshot available"}, status_code=404)
    return Response(content=jpeg_bytes, media_type="image/jpeg")

@app.get("/api/logs")
async def get_logs(limit: int = 50):
    return JSONResponse({"logs": get_recent_logs(limit), "stats": get_db_stats()})
