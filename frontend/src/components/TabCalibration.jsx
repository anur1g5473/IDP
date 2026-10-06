import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Crosshair, Save, RefreshCw, Layers, Trash2 } from 'lucide-react';

const ALL_CLASSES = [
  { id: 'car', label: 'Car' },
  { id: 'motorcycle', label: 'Motorcycle' },
  { id: 'bus', label: 'Bus' },
  { id: 'truck', label: 'Truck' },
  { id: 'auto_rickshaw', label: 'Auto Rickshaw' },
  { id: 'ambulance', label: 'Ambulance (Emergency)' },
  { id: 'bicycle', label: 'Bicycle' },
  { id: 'person', label: 'Pedestrian' },
];

const DEFAULT_CONFIG = {
  model: {
    weights: 'yolo11n.pt',
    conf_thresh: 0.40,
    iou_thresh: 0.45,
    imgsz: 640,
    tracker: 'bytetrack.yaml',
    enable_tracking: true,
    active_classes: ['car', 'motorcycle', 'bus', 'truck', 'auto_rickshaw', 'ambulance', 'person'],
  },
  side_a: {
    roi_polygon: [[0.05, 0.15], [0.95, 0.15], [0.95, 0.95], [0.05, 0.95]],
    incoming_line: [[0.10, 0.40], [0.90, 0.40]],
    outgoing_line: [[0.10, 0.75], [0.90, 0.75]],
  },
  side_b: {
    roi_polygon: [[0.05, 0.15], [0.95, 0.15], [0.95, 0.95], [0.05, 0.95]],
    incoming_line: [[0.10, 0.40], [0.90, 0.40]],
    outgoing_line: [[0.10, 0.75], [0.90, 0.75]],
  },
};

export default function TabCalibration() {
  const [activeSide, setActiveSide] = useState('side_a');
  const [drawTool, setDrawTool] = useState('ROI');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    fetchConfig();
    fetchSnapshot();
  }, [activeSide]); // eslint-disable-line

  useEffect(() => {
    redrawCanvas();
  }, [config, activeSide]); // eslint-disable-line

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/calibration/config');
      const data = await res.json();
      if (data && data.model) setConfig(data);
    } catch (err) {
      console.error('Failed to fetch calibration config:', err);
    }
  };

  const fetchSnapshot = () => {
    const sideParam = activeSide === 'side_a' ? 'a' : 'b';
    setSnapshotUrl('/api/calibration/snapshot/' + sideParam + '?t=' + Date.now());
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/calibration/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.status === 'ok') showToast('Calibration saved successfully!', 'success');
      else showToast('Failed to save: ' + data.message, 'error');
    } catch (err) {
      showToast('Error saving calibration: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type: type || 'info' });
    setTimeout(() => setToast(null), 3500);
  };
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext('2d');
    canvas.width = img.clientWidth || 640;
    canvas.height = img.clientHeight || 480;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const W = canvas.width;
    const H = canvas.height;
    const sideData = config[activeSide] || {};
    const roi = sideData.roi_polygon || [];
    const incLine = sideData.incoming_line || [];
    const outLine = sideData.outgoing_line || [];
    if (roi.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(roi[0][0] * W, roi[0][1] * H);
      for (let i = 1; i < roi.length; i++) ctx.lineTo(roi[i][0] * W, roi[i][1] * H);
      ctx.closePath();
      ctx.fillStyle = 'rgba(180,50,180,0.2)';
      ctx.fill();
      ctx.strokeStyle = '#D946EF';
      ctx.lineWidth = 3;
      ctx.stroke();
      roi.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt[0] * W, pt[1] * H, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#FF00FF';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }
    if (incLine.length === 2) {
      ctx.beginPath();
      ctx.moveTo(incLine[0][0] * W, incLine[0][1] * H);
      ctx.lineTo(incLine[1][0] * W, incLine[1][1] * H);
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('INCOMING', incLine[0][0] * W + 6, incLine[0][1] * H - 6);
    }
    if (outLine.length === 2) {
      ctx.beginPath();
      ctx.moveTo(outLine[0][0] * W, outLine[0][1] * H);
      ctx.lineTo(outLine[1][0] * W, outLine[1][1] * H);
      ctx.strokeStyle = '#FFDD00';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#FFDD00';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('OUTGOING', outLine[0][0] * W + 6, outLine[0][1] * H - 6);
    }
  };

  const roundCoord = (val) => Math.round(val * 1000) / 1000;

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const xNorm = roundCoord(Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)));
    const yNorm = roundCoord(Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)));
    const updated = JSON.parse(JSON.stringify(config));
    const side = updated[activeSide];
    if (drawTool === 'ROI') {
      if (!side.roi_polygon) side.roi_polygon = [];
      if (side.roi_polygon.length >= 8) side.roi_polygon = [];
      side.roi_polygon.push([xNorm, yNorm]);
    } else if (drawTool === 'INC_LINE') {
      if (!side.incoming_line || side.incoming_line.length >= 2) side.incoming_line = [[xNorm, yNorm]];
      else side.incoming_line.push([xNorm, yNorm]);
    } else if (drawTool === 'OUT_LINE') {
      if (!side.outgoing_line || side.outgoing_line.length >= 2) side.outgoing_line = [[xNorm, yNorm]];
      else side.outgoing_line.push([xNorm, yNorm]);
    }
    setConfig(updated);
  };

  const handleModelChange = (field, value) => {
    const updated = JSON.parse(JSON.stringify(config));
    updated.model[field] = value;
    setConfig(updated);
  };

  const toggleClass = (clsId) => {
    const updated = JSON.parse(JSON.stringify(config));
    const list = updated.model.active_classes || [];
    if (list.includes(clsId)) updated.model.active_classes = list.filter((c) => c !== clsId);
    else updated.model.active_classes = [...list, clsId];
    setConfig(updated);
  };

  const resetCurrentSideLines = () => {
    const updated = JSON.parse(JSON.stringify(config));
    updated[activeSide].roi_polygon = [[0.05,0.15],[0.95,0.15],[0.95,0.95],[0.05,0.95]];
    updated[activeSide].incoming_line = [[0.10,0.40],[0.90,0.40]];
    updated[activeSide].outgoing_line = [[0.10,0.75],[0.90,0.75]];
    setConfig(updated);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.8fr) minmax(300px, 1.2fr)', gap: '16px', margin: '16px 24px' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#063312' : '#330806',
          border: '2px solid ' + (toast.type === 'success' ? 'var(--signal-green)' : 'var(--signal-red)'),
          color: '#FFF', padding: '12px 20px', boxShadow: '4px 4px 0px #000',
          fontFamily: 'var(--font-mono)', fontSize: '0.85rem',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="hud-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={20} color="var(--mint-mist)" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', textTransform: 'uppercase' }}>
                ROAD TOPOLOGY &amp; ROI CALIBRATION CANVAS
              </h3>
            </div>
            <button className="btn-brutal btn-secondary" onClick={fetchSnapshot} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <RefreshCw size={14} /> CAPTURE SNAPSHOT
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button className={'btn-brutal ' + (activeSide === 'side_a' ? 'btn-mint' : 'btn-secondary')}
              onClick={() => setActiveSide('side_a')} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}>
              SIDE A (WEST APPROACH)
            </button>
            <button className={'btn-brutal ' + (activeSide === 'side_b' ? 'btn-mint' : 'btn-secondary')}
              onClick={() => setActiveSide('side_b')} style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem' }}>
              SIDE B (EAST APPROACH)
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button className={'btn-brutal ' + (drawTool === 'ROI' ? 'btn-danger' : 'btn-secondary')}
              onClick={() => setDrawTool('ROI')} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <Layers size={14} /> ROI POLYGON
            </button>
            <button className={'btn-brutal ' + (drawTool === 'INC_LINE' ? 'btn-mint' : 'btn-secondary')}
              onClick={() => setDrawTool('INC_LINE')} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              INCOMING LINE
            </button>
            <button className={'btn-brutal ' + (drawTool === 'OUT_LINE' ? 'btn-amber' : 'btn-secondary')}
              onClick={() => setDrawTool('OUT_LINE')} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              OUTGOING LINE
            </button>
            <button className="btn-brutal btn-secondary" onClick={resetCurrentSideLines} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <Trash2 size={14} /> RESET
            </button>
          </div>
          <div style={{ position: 'relative', width: '100%', backgroundColor: '#000', border: '2px solid var(--royal-plum)', overflow: 'hidden' }}>
            <img ref={imgRef} src={snapshotUrl || '/api/calibration/snapshot/a'} onLoad={redrawCanvas}
              alt="Road Calibration Snapshot" style={{ width: '100%', display: 'block', opacity: 0.85 }} />
            <canvas ref={canvasRef} onClick={handleCanvasClick}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', zIndex: 10 }} />
          </div>
          <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)' }}>
            {drawTool === 'ROI' && 'Click to add ROI polygon vertices (max 8). Auto-resets after 8 points.'}
            {drawTool === 'INC_LINE' && 'Click 2 points to define the INCOMING counting line.'}
            {drawTool === 'OUT_LINE' && 'Click 2 points to define the OUTGOING counting line.'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="hud-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--mint-mist)" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', textTransform: 'uppercase' }}>
              AI MODEL &amp; TRACKER PARAMETERS
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Confidence Threshold:</span>
                <strong style={{ color: 'var(--mint-mist)' }}>{config.model.conf_thresh}</strong>
              </div>
              <input type="range" min="0.10" max="0.90" step="0.05" value={config.model.conf_thresh}
                onChange={(e) => handleModelChange('conf_thresh', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--mint-mist)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>IoU NMS Threshold:</span>
                <strong style={{ color: 'var(--mint-mist)' }}>{config.model.iou_thresh}</strong>
              </div>
              <input type="range" min="0.20" max="0.80" step="0.05" value={config.model.iou_thresh}
                onChange={(e) => handleModelChange('iou_thresh', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--mint-mist)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Frame Resolution (imgsz):</span>
              <select value={config.model.imgsz} onChange={(e) => handleModelChange('imgsz', parseInt(e.target.value))}
                style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)', border: '1px solid var(--royal-plum)', padding: '4px 8px', fontFamily: 'var(--font-mono)' }}>
                <option value={480}>480 px (Fastest)</option>
                <option value={640}>640 px (Recommended)</option>
                <option value={800}>800 px (High Detail)</option>
                <option value={1024}>1024 px (Ultra)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>BYTETrack Tracking:</span>
              <input type="checkbox" checked={config.model.enable_tracking}
                onChange={(e) => handleModelChange('enable_tracking', e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--mint-mist)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Active Vehicle Classes:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {ALL_CLASSES.map((cls) => {
                  const isActive = (config.model.active_classes || []).includes(cls.id);
                  return (
                    <button key={cls.id} onClick={() => toggleClass(cls.id)}
                      className={'btn-brutal ' + (isActive ? 'btn-mint' : 'btn-secondary')}
                      style={{ padding: '6px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={isActive} readOnly style={{ pointerEvents: 'none' }} />
                      {cls.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="btn-brutal btn-mint" onClick={handleSaveConfig} disabled={saving}
              style={{ marginTop: '8px', padding: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Save size={18} />
              {saving ? 'SAVING...' : 'SAVE & APPLY CALIBRATION'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
