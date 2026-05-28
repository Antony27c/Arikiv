import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "reports.db")

def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reporte_id TEXT UNIQUE,
            payload TEXT NOT NULL,
            audit TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn

def save_report(reporte_id, payload, audit):
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO reports (reporte_id, payload, audit, created_at) VALUES (?, ?, ?, ?)",
            (reporte_id, json.dumps(payload, ensure_ascii=False), json.dumps(audit, ensure_ascii=False), datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def list_reports(limit=50, tipo=None):
    conn = _get_conn()
    try:
        if tipo:
            rows = conn.execute(
                "SELECT * FROM reports WHERE json_extract(payload, '$.datos_evento.tipo_incidente') = ? ORDER BY id DESC LIMIT ?",
                (tipo, limit)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM reports ORDER BY id DESC LIMIT ?",
                (limit,)
            ).fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "reporte_id": r["reporte_id"],
                "payload": json.loads(r["payload"]),
                "audit": json.loads(r["audit"]),
                "created_at": r["created_at"],
            })
        return result
    finally:
        conn.close()
