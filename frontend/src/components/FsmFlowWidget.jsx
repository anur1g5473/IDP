import React from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';

export default function FsmFlowWidget({ currentFsmState, elapsedTime }) {
  const states = [
    { id: 'INIT', label: 'INIT' },
    { id: 'SIDE_A_GREEN', label: 'SIDE A GREEN' },
    { id: 'ALL_RED_CLEARANCE_A_TO_B', label: 'CLEAR A→B' },
    { id: 'SIDE_B_GREEN', label: 'SIDE B GREEN' },
    { id: 'ALL_RED_CLEARANCE_B_TO_A', label: 'CLEAR B→A' },
  ];

  const isEmergency = currentFsmState === 'EMERGENCY_ALL_RED' || currentFsmState === 'ALL_RED';

  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '2px solid var(--royal-plum)',
      padding: '12px',
      boxShadow: '3px 3px 0px #000',
      marginBottom: '14px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          FSM STATE PIPELINE
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--mint-mist)' }}>
          TIMER: <strong>{typeof elapsedTime === 'number' ? elapsedTime.toFixed(1) : '0.0'} s</strong>
        </div>
      </div>

      {isEmergency ? (
        <div style={{
          backgroundColor: 'rgba(255,59,48,0.2)',
          border: '2px solid var(--signal-red)',
          padding: '8px 12px',
          color: 'var(--signal-red)',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          boxShadow: '0 0 12px var(--signal-red-glow)'
        }}>
          <AlertTriangle size={18} className="pulse-dot" />
          EMERGENCY ALL RED OVERRIDE ACTIVE
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {states.map((st, index) => {
            const isActive = currentFsmState === st.id;
            return (
              <React.Fragment key={st.id}>
                <div style={{
                  padding: '6px 10px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                  border: isActive ? '2px solid var(--mint-mist)' : '1px solid var(--royal-plum)',
                  backgroundColor: isActive ? 'var(--royal-plum)' : 'var(--bg-dark)',
                  color: isActive ? 'var(--vanilla-cream)' : 'var(--text-muted)',
                  boxShadow: isActive ? '0 0 10px var(--mint-mist-glow)' : 'none',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}>
                  {st.label}
                </div>
                {index < states.length - 1 && (
                  <ArrowRight size={12} color="var(--royal-plum)" style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
