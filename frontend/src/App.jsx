import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import TabNav from './components/TabNav';
import TabDualLive from './components/TabDualLive';
import TabSingleMedia from './components/TabSingleMedia';
import TabDatabaseLogs from './components/TabDatabaseLogs';
import Background3D from './components/Background3D';
import ConfirmModal from './components/ConfirmModal';
import './theme.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('tab-live');
  const [theme, setTheme] = useState(() => localStorage.getItem('underpass_theme') || 'dark');
  const [lowPower, setLowPower] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  // System Telemetry State
  const [telemetry, setTelemetry] = useState({
    decision: { fsm_state: 'INIT', signal_side_a: 'RED', signal_side_b: 'RED', elapsed_seconds: 0.0, emergency_active: false },
    sideA: { total_vehicles: 0, counts: {} },
    sideB: { total_vehicles: 0, counts: {} },
    hardwareConnected: false,
    mode: 'LIVE',
    dualSimActive: false
  });

  // Apply theme attribute to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('underpass_theme', theme);
  }, [theme]);

  // WebSocket Telemetry Listener
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:8000';
    const wsUrl = `${wsProtocol}//${host}/ws/telemetry`;

    let ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry({
          decision: data.decision || {},
          sideA: data.side_a || {},
          sideB: data.side_b || {},
          hardwareConnected: !!data.hardware_connected,
          mode: data.decision?.manual_override ? 'MANUAL' : data.decision?.emergency_active ? 'EMERGENCY' : (data.mode || 'LIVE'),
          dualSimActive: !!data.dual_sim_active
        });
      } catch (err) {
        console.error("WebSocket payload error:", err);
      }
    };

    ws.onerror = (err) => console.warn("WebSocket connection warning:", err);

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const sendOverride = async (overrideMode) => {
    try {
      await fetch(`/api/override/${overrideMode}`, { method: 'POST' });
    } catch (err) {
      console.error("Override error:", err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Interactive 3D Canvas Background */}
      <Background3D
        lowPower={lowPower}
        currentMode={telemetry.mode}
        fsmState={telemetry.decision.fsm_state}
      />

      {/* Header HUD */}
      <Header
        hardwareConnected={telemetry.hardwareConnected}
        currentMode={telemetry.mode}
        dualSimActive={telemetry.dualSimActive}
        theme={theme}
        setTheme={setTheme}
        lowPower={lowPower}
        setLowPower={setLowPower}
      />

      {/* Tab Navigation */}
      <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content */}
      <main>
        {activeTab === 'tab-live' && (
          <TabDualLive
            decision={telemetry.decision}
            sideA={telemetry.sideA}
            sideB={telemetry.sideB}
            dualSimActive={telemetry.dualSimActive}
            onSendOverride={sendOverride}
            onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
          />
        )}

        {activeTab === 'tab-single' && <TabSingleMedia />}

        {activeTab === 'tab-db' && <TabDatabaseLogs />}
      </main>

      {/* Safety Emergency Modal */}
      <ConfirmModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onConfirm={() => sendOverride('ALL_RED')}
      />
    </div>
  );
}

