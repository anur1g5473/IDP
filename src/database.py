import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "traffic_logs.db"))

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traffic_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            fsm_state TEXT NOT NULL,
            side_a_signal TEXT NOT NULL,
            side_b_signal TEXT NOT NULL,
            side_a_count INTEGER NOT NULL,
            side_b_count INTEGER NOT NULL,
            side_a_details TEXT NOT NULL,
            side_b_details TEXT NOT NULL,
            emergency_flag INTEGER NOT NULL,
            manual_override TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicle_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            count INTEGER NOT NULL,
            side TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()

def log_traffic_event(fsm_state: str, side_a_signal: str, side_b_signal: str, 
                      side_a_count: int, side_b_count: int, 
                      side_a_details: str, side_b_details: str, 
                      emergency_flag: bool, manual_override: str = None):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        cursor.execute('''
            INSERT INTO traffic_logs 
            (timestamp, fsm_state, side_a_signal, side_b_signal, side_a_count, side_b_count, side_a_details, side_b_details, emergency_flag, manual_override)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (now_str, fsm_state, side_a_signal, side_b_signal, side_a_count, side_b_count, 
              side_a_details, side_b_details, 1 if emergency_flag else 0, manual_override or "AUTO"))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB Error] Failed to log traffic event: {e}")

def get_recent_logs(limit: int = 50):
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM traffic_logs ORDER BY id DESC LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        logs = [dict(row) for row in rows]
        conn.close()
        return logs
    except Exception as e:
        print(f"[DB Error] Failed to fetch logs: {e}")
        return []

def get_db_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM traffic_logs')
        total_logs = cursor.fetchone()[0]
        
        cursor.execute('SELECT SUM(side_a_count + side_b_count) FROM traffic_logs')
        total_vehicles = cursor.fetchone()[0] or 0
        
        cursor.execute('SELECT COUNT(*) FROM traffic_logs WHERE emergency_flag = 1')
        emergency_events = cursor.fetchone()[0]
        
        conn.close()
        return {
            "total_logs": total_logs,
            "total_vehicles_logged": total_vehicles,
            "emergency_events": emergency_events
        }
    except Exception as e:
        print(f"[DB Error] Failed to fetch stats: {e}")
        return {"total_logs": 0, "total_vehicles_logged": 0, "emergency_events": 0}

if __name__ == "__main__":
    init_db()
    print(f"[DB] Initialized database at: {DB_PATH}")
