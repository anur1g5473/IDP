import React from 'react';
import { Monitor, FileSearch, Database } from 'lucide-react';

export default function TabNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'tab-live', label: 'Dual Live & 3D Twin', icon: Monitor },
    { id: 'tab-single', label: 'Single Media Test', icon: FileSearch },
    { id: 'tab-db', label: 'Database Logs', icon: Database }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      margin: '16px 24px 0 24px',
      borderBottom: '2px solid var(--royal-plum)',
      paddingBottom: '8px'
    }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`btn-brutal ${isActive ? 'btn-mint' : 'btn-secondary'}`}
            style={{
              padding: '10px 18px',
              fontSize: '0.85rem',
              letterSpacing: '0.5px'
            }}
          >
            <Icon size={16} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
