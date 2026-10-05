import React, { useState } from 'react';
import SignalWidget from './SignalWidget';
import FsmFlowWidget from './FsmFlowWidget';
import DigitalTwin3D from './DigitalTwin3D';
import { Play, Square, AlertOctagon, RotateCcw, Video } from 'lucide-react';

export default function TabDualLive({
  decision,
  sideA,
  sideB,
  dualSimActive,
  onSendOverride,
  onOpenEmergencyModal
}) {
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [feedA, setFeedA] = useState('/api/video_feed/a');
  const [feedB, setFeedB] = useState('/api/video_feed/b');
  const [uploading, setUploading] = useState(false);

  const handleDualUpload = async (e) => {
    e.preventDefault();
    if (!fileA || !fileB) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file_a', fileA);
    formData.append('file_b', fileB);

    try {
      const res = await fetch('/api/upload/dual', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.status === 'ok') {
        const timestamp = new Date().getTime();
        setFeedA(result.side_a_feed + '?' + timestamp);
        setFeedB(result.side_b_feed + '?' + timestamp);
      }
    } catch (err) {
      console.error("Dual simulation upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleStopSimulation = async () => {
    try {
      await fetch('/api/simulation/stop', { method: 'POST' });
    } catch (err) {
      console.error("Stop simulation error:", err);
    }
  };

  const sigAColor = decision.signal_side_a || decision.side_a_signal || 'RED';
  const sigBColor = decision.signal_side_b || decision.side_b_signal || 'RED';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', margin: '16px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(280px, 1fr)', gap: '16px' }}>
        {/* Left Column: Video Feeds & Digital Twin */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Dual Camera Monitor Card */}
          <div className="hud-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Video size={18} color="var(--mint-mist)" />
                <h3 style={{ margin: 0, fontSize: '0.95rem', textTransform: 'uppercase' }}>
                  LIVE UNDERPASS CAMERAS (YOLO DETECTORS)
                </h3>
              </div>
              <span className={`badge-brutal ${dualSimActive ? 'badge-connected' : 'badge-sim'}`}>
                {dualSimActive ? 'DUAL SIMULATION ACTIVE' : 'SIMULATION IDLE'}
              </span>
            </div>

            {/* Video Feeds Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ backgroundColor: '#000', border: '2px solid var(--royal-plum)', boxShadow: '3px 3px 0px #000', position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--mint-mist)', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--mint-mist)', zIndex: 2 }}>
                  SIDE A (CAMPUS WEST)
                </div>
                <img src={feedA} alt="Side A Stream" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ backgroundColor: '#000', border: '2px solid var(--royal-plum)', boxShadow: '3px 3px 0px #000', position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.85)', border: '1px solid var(--mint-mist)', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: 'var(--mint-mist)', zIndex: 2 }}>
                  SIDE B (CAMPUS EAST)
                </div>
                <img src={feedB} alt="Side B Stream" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
            </div>

            {/* Dual Upload Form */}
            <form onSubmit={handleDualUpload} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="file" accept="video/*" required onChange={(e) => setFileA(e.target.files[0])} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', flex: 1 }} />
              <input type="file" accept="video/*" required onChange={(e) => setFileB(e.target.files[0])} style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-sub)', flex: 1 }} />
              <button type="submit" className="btn-brutal btn-mint" disabled={uploading} style={{ padding: '8px 14px', fontSize: '0.75rem' }}>
                <Play size={14} /> {uploading ? 'LOADING...' : 'START DUAL TEST'}
              </button>
              <button type="button" className="btn-brutal btn-secondary" onClick={handleStopSimulation} style={{ padding: '8px 14px', fontSize: '0.75rem' }}>
                <Square size={14} /> STOP
              </button>
            </form>
          </div>

          {/* 3D Digital Twin Card */}
          <div className="hud-panel">
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', textTransform: 'uppercase' }}>
              3D DIGITAL TWIN (VIT UNDERPASS)
            </h3>
            <DigitalTwin3D signalA={sigAColor} signalB={sigBColor} countA={sideA.total_vehicles || 0} countB={sideB.total_vehicles || 0} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Signal Monitors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <SignalWidget sideName="SIDE A (WEST)" signalColor={sigAColor} vehicleCount={sideA.total_vehicles || 0} />
            <SignalWidget sideName="SIDE B (EAST)" signalColor={sigBColor} vehicleCount={sideB.total_vehicles || 0} />
          </div>

          {/* FSM Decision Engine Card */}
          <div className="hud-panel">
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--text-main)' }}>
              FSM DECISION ENGINE
            </h3>

            {/* Visual State Pipeline */}
            <FsmFlowWidget currentFsmState={decision.fsm_state || 'INIT'} elapsedTime={decision.elapsed_seconds || 0} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Side A Vehicle Count:</span>
                <strong style={{ color: 'var(--mint-mist)' }}>{sideA.total_vehicles || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Side B Vehicle Count:</span>
                <strong style={{ color: 'var(--mint-mist)' }}>{sideB.total_vehicles || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Active Manual Override:</span>
                <strong style={{ color: decision.manual_override ? 'var(--signal-amber)' : 'var(--mint-mist)' }}>
                  {decision.manual_override || 'NONE (AUTO)'}
                </strong>
              </div>
            </div>

            {/* Manual Overrides Controls */}
            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
              MANUAL OVERRIDES & SAFETY CONTROLS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn-brutal btn-secondary" onClick={() => onSendOverride('SIDE_A')}>
                FORCE SIDE A GREEN
              </button>
              <button className="btn-brutal btn-secondary" onClick={() => onSendOverride('SIDE_B')}>
                FORCE SIDE B GREEN
              </button>
              <button className="btn-brutal btn-danger" onClick={onOpenEmergencyModal}>
                <AlertOctagon size={16} /> EMERGENCY ALL RED
              </button>
              <button className="btn-brutal btn-mint" onClick={() => onSendOverride('RESET')}>
                <RotateCcw size={16} /> RESET AUTOMATIC AI MODE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
