import React from 'react';
import { AlertOctagon, X, Check } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '3px solid var(--signal-red)',
        boxShadow: '8px 8px 0px #000',
        width: '100%',
        maxWidth: '440px',
        padding: '20px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--signal-red)',
          marginBottom: '12px'
        }}>
          <AlertOctagon size={28} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {title || 'EMERGENCY OVERRIDE CONFIRMATION'}
          </h3>
        </div>

        <p style={{
          color: 'var(--text-main)',
          fontSize: '0.85rem',
          lineHeight: '1.4',
          marginBottom: '20px',
          fontFamily: 'var(--font-mono)'
        }}>
          {message || 'Are you sure you want to enforce EMERGENCY ALL RED? This will halt traffic signals on Side A and Side B immediately.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="btn-brutal btn-secondary"
            onClick={onClose}
          >
            <X size={16} /> CANCEL
          </button>
          <button
            className="btn-brutal btn-danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Check size={16} /> CONFIRM OVERRIDE
          </button>
        </div>
      </div>
    </div>
  );
}
