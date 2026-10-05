import React, { useState, useEffect } from 'react';
import { RefreshCw, Database, Activity, ShieldAlert, Search } from 'lucide-react';

export default function TabDatabaseLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_logs: 0, total_vehicles_logged: 0, emergency_events: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs?limit=50');
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || { total_logs: 0, total_vehicles_logged: 0, emergency_events: 0 });
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.timestamp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.fsm_state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.manual_override?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesState = filterState === 'ALL' ||
      (filterState === 'EMERGENCY' && log.emergency_flag) ||
      (filterState === 'OVERRIDE' && log.manual_override) ||
      log.fsm_state === filterState;

    return matchesSearch && matchesState;
  });

  return (
    <div style={{ margin: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--bg-panel)', border: '2px solid var(--royal-plum)', boxShadow: '4px 4px 0px #000', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Database size={32} color="var(--royal-plum-light)" />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL EVENTS LOGGED</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{stats.total_logs}</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="hud-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', textTransform: 'uppercase' }}>
            RECENT TRAFFIC AUDIT LOGS (SQLITE DB)
          </h3>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '8px' }} />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '6px 8px 6px 28px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--royal-plum)', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
              />
            </div>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{ padding: '6px 8px', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--royal-plum)', color: 'var(--mint-mist)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
            >
              <option value="ALL">ALL STATES</option>
              <option value="EMERGENCY">EMERGENCY ONLY</option>
              <option value="OVERRIDE">MANUAL OVERRIDES</option>
              <option value="SIDE_A_GREEN">SIDE_A_GREEN</option>
              <option value="SIDE_B_GREEN">SIDE_B_GREEN</option>
            </select>

            <button className="btn-brutal btn-mint" onClick={fetchLogs} disabled={loading} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
              <RefreshCw size={14} /> {loading ? 'REFRESHING...' : 'REFRESH'}
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--royal-plum)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--bg-card)', zIndex: 5, borderBottom: '2px solid var(--royal-plum)' }}>
              <tr>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--mint-mist)' }}>TIMESTAMP</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--mint-mist)' }}>FSM STATE</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--mint-mist)' }}>SIGNAL A</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--mint-mist)' }}>SIGNAL B</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--mint-mist)' }}>COUNT A</th>
                <th style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--mint-mist)' }}>COUNT B</th>
                <th style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--mint-mist)' }}>EMERGENCY</th>
                <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--mint-mist)' }}>OVERRIDE</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No database logs matching selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr
                    key={log.id || index}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'rgba(0,0,0,0.15)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <td style={{ padding: '8px' }}>{log.timestamp}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{log.fsm_state}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: log.side_a_signal === 'GREEN' ? 'var(--signal-green)' : 'var(--signal-red)', fontWeight: 'bold' }}>
                      {log.side_a_signal}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', color: log.side_b_signal === 'GREEN' ? 'var(--signal-green)' : 'var(--signal-red)', fontWeight: 'bold' }}>
                      {log.side_b_signal}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{log.side_a_count}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{log.side_b_count}</td>
                    <td style={{ padding: '8px', textAlign: 'center', color: log.emergency_flag ? 'var(--signal-red)' : 'var(--text-muted)', fontWeight: log.emergency_flag ? 'bold' : 'normal' }}>
                      {log.emergency_flag ? 'YES' : 'NO'}
                    </td>
                    <td style={{ padding: '8px', color: log.manual_override ? 'var(--signal-amber)' : 'var(--text-muted)' }}>
                      {log.manual_override || 'AUTO'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
