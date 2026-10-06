import React from 'react';

export default function SignalWidget({ sideName, signalColor, vehicleCount, incomingCount = 0, outgoingCount = 0 }) {
  const isRed = signalColor === 'RED';
  const isAmber = signalColor === 'AMBER' || signalColor === 'YELLOW';
  const isGreen = signalColor === 'GREEN';

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '2px solid var(--royal-plum)',
      boxShadow: '3px 3px 0px #000',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          SIGNAL MONITOR
        </div>
        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--text-main)' }}>
          {sideName}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
          <span>Queue: <strong style={{ color: 'var(--mint-mist)' }}>{vehicleCount}</strong></span>
          <span style={{ color: 'var(--royal-plum-light)' }}>|</span>
          <span style={{ color: '#00FFFF' }}>IN: <strong>{incomingCount}</strong></span>
          <span style={{ color: 'var(--royal-plum-light)' }}>|</span>
          <span style={{ color: '#FFA500' }}>OUT: <strong>{outgoingCount}</strong></span>
        </div>
      </div>

      {/* Traffic Lamp Housing */}
      <div style={{
        backgroundColor: '#000',
        border: '2px solid var(--border-color)',
        padding: '6px 8px',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
      }}>
        {/* Red Lamp */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isRed ? 'var(--signal-red)' : '#330806',
          boxShadow: isRed ? '0 0 14px var(--signal-red-glow)' : 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.2s ease'
        }} title="RED" />

        {/* Amber Lamp */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isAmber ? 'var(--signal-amber)' : '#332900',
          boxShadow: isAmber ? '0 0 14px var(--signal-amber-glow)' : 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.2s ease'
        }} title="AMBER" />

        {/* Green Lamp */}
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: isGreen ? 'var(--signal-green)' : '#063312',
          boxShadow: isGreen ? '0 0 14px var(--signal-green-glow)' : 'none',
          border: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.2s ease'
        }} title="GREEN" />
      </div>
    </div>
  );
}
