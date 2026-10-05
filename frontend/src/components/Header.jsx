import React, { useState, useEffect } from 'react';
import { Shield, Sun, Moon, Zap, Cpu, Activity, Clock } from 'lucide-react';

export const COLLEGE_NAME = "VIT";

export default function Header({
  hardwareConnected,
  currentMode,
  dualSimActive,
  theme,
  setTheme,
  lowPower,
  setLowPower
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(Math.floor(now.getMilliseconds() / 100)).padStart(1, '0'));
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <header style={{
      backgroundColor: 'var(--bg-panel)',
      borderBottom: '3px solid var(--royal-plum)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      position: 'relative',
      zIndex: 10
    }}>
      {/* Title & Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          backgroundColor: 'var(--royal-plum)',
          color: 'var(--vanilla-cream)',
          padding: '8px 10px',
          border: '2px solid #000',
          boxShadow: '3px 3px 0px #000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Activity size={22} color="var(--mint-mist)" />
        </div>
        <div>
          <h1 style={{
            fontSize: '1.25rem',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: 'var(--text-main)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--mint-mist)' }}>{COLLEGE_NAME}</span> UNDERPASS SUPERVISORY DASHBOARD
          </h1>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            AUTOMATED AI TRAFFIC CONTROLLER & DIGITAL TWIN
          </div>
        </div>
      </div>

      {/* Center Telemetry HUD */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'var(--bg-dark)',
        padding: '6px 14px',
        border: '1px solid var(--royal-plum)',
        boxShadow: '2px 2px 0px #000'
      }}>
        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <Clock size={14} color="var(--mint-mist)" />
          <span style={{ color: 'var(--mint-mist)', fontWeight: 'bold' }}>{timeStr}</span>
        </div>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--royal-plum)' }} />

        {/* Operating Mode */}
        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
          MODE: <strong style={{
            color: currentMode === 'EMERGENCY' ? 'var(--signal-red)' : currentMode === 'MANUAL' ? 'var(--signal-amber)' : 'var(--mint-mist)'
          }}>{currentMode}</strong>
        </div>

        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--royal-plum)' }} />

        {/* HW Badge */}
        {hardwareConnected ? (
          <span className="badge-brutal badge-connected">
            <span className="pulse-dot" /> HW: ESP32 CONNECTED (COM3)
          </span>
        ) : (
          <span className="badge-brutal badge-disconnected">
            <span className="pulse-dot" style={{ animationDuration: '0.8s' }} /> HW: DISCONNECTED (SIMULATION)
          </span>
        )}
      </div>

      {/* Quick Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Low Power Mode Toggle */}
        <button
          className={`btn-brutal ${lowPower ? 'btn-mint' : 'btn-secondary'}`}
          onClick={() => setLowPower(!lowPower)}
          title="Toggle Three.js performance mode"
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
        >
          <Zap size={14} />
          {lowPower ? 'ECO: ON' : 'ECO: OFF'}
        </button>

        {/* Theme Toggle */}
        <button
          className="btn-brutal btn-secondary"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle Light / Dark Brutalist Theme"
          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
        >
          {theme === 'dark' ? <Sun size={14} color="var(--signal-amber)" /> : <Moon size={14} color="var(--royal-plum)" />}
          {theme === 'dark' ? 'LIGHT' : 'DARK'}
        </button>
      </div>
    </header>
  );
}
