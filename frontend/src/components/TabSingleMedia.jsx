import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function TabSingleMedia() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleUpload = async (files) => {
    if (!files || !files.length) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload/single', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.status === 'ok') {
        setResult(data.result);
      }
    } catch (err) {
      console.error("Single upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const telemetry = result?.telemetry || {};
  const counts = telemetry.counts || {};

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) minmax(260px, 1fr)', gap: '16px', margin: '16px 24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="hud-panel">
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', textTransform: 'uppercase' }}>
            SINGLE IMAGE / VIDEO TEST ANALYZER
          </h3>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('single-file-input').click()}
            style={{
              border: dragOver ? '3px dashed var(--mint-mist)' : '2px dashed var(--royal-plum)',
              backgroundColor: dragOver ? 'rgba(168,213,186,0.1)' : 'var(--bg-dark)',
              boxShadow: 'inset 0 0 10px #000',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <UploadCloud size={42} color="var(--royal-plum-light)" style={{ marginBottom: '8px' }} />
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--mint-mist)', fontWeight: 'bold' }}>
              Click or Drop Image / Video File Here to Analyze
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Supports .jpg, .png, .mp4
            </p>
            <input type="file" id="single-file-input" style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />
          </div>

          {loading && (
            <div style={{ marginTop: '16px', textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--mint-mist)' }}>
              RUNNING YOLO INFERENCE... PLEASE WAIT
            </div>
          )}

          {result && !loading && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                  YOLO ANNOTATED DETECTION FRAME
                </div>
                <div style={{ backgroundColor: '#000', border: '2px solid var(--royal-plum)', boxShadow: '4px 4px 0px #000', overflow: 'hidden' }}>
                  <img src={result.url + '?' + new Date().getTime()} alt="YOLO Detection Result" style={{ width: '100%', display: 'block' }} />
                </div>
              </div>
              {result.type === 'video' && result.video_url && (
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    SOURCE VIDEO PLAYBACK
                  </div>
                  <div style={{ backgroundColor: '#000', border: '2px solid var(--royal-plum)', boxShadow: '4px 4px 0px #000', overflow: 'hidden' }}>
                    <video src={result.video_url} controls style={{ width: '100%', display: 'block', maxHeight: '300px' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="hud-panel">
          <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', textTransform: 'uppercase' }}>
            DETECTION BREAKDOWN
          </h3>

          {!result ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              Upload an image or video to view full vehicle breakdown & inference latency telemetry.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Total Vehicles Detected:</span>
                <strong style={{ color: 'var(--mint-mist)', fontSize: '1rem' }}>{telemetry.total_vehicles || 0}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Inference Latency:</span>
                <strong style={{ color: 'var(--text-main)' }}>{(telemetry.inference_ms || 0).toFixed(1)} ms</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <span>Emergency Vehicle:</span>
                <strong style={{ color: telemetry.has_emergency ? 'var(--signal-red)' : 'var(--signal-green)' }}>
                  {telemetry.has_emergency ? 'YES (PRIORITY ALERT)' : 'NO'}
                </strong>
              </div>

              <h4 style={{ margin: '12px 0 6px 0', fontSize: '0.8rem', color: 'var(--text-sub)', textTransform: 'uppercase' }}>
                Vehicle Class Breakdown:
              </h4>

              {Object.keys(counts).length === 0 ? (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No vehicles detected in frame.</span>
              ) : (
                Object.entries(counts).map(([cls, cnt]) => (
                  <div key={cls} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ textTransform: 'uppercase' }}>{cls}:</span>
                    <strong style={{ color: 'var(--mint-mist)' }}>{cnt}</strong>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
