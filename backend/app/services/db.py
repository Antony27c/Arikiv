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
            admin_verification TEXT DEFAULT NULL,
            created_at TEXT NOT NULL
        )
    """)
    try:
        conn.execute("ALTER TABLE reports ADD COLUMN admin_verification TEXT DEFAULT NULL")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    return conn

def save_report(reporte_id, payload, audit):
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO reports (reporte_id, payload, audit, admin_verification, created_at) VALUES (?, ?, ?, 'pending', ?)",
            (reporte_id, json.dumps(payload, ensure_ascii=False), json.dumps(audit, ensure_ascii=False), datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def verify_report(reporte_id, status):
    conn = _get_conn()
    try:
        cur = conn.execute(
            "UPDATE reports SET admin_verification = ? WHERE reporte_id = ?",
            (status, reporte_id)
        )
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()

def list_reports(limit=50, tipo=None, verification=None):
    conn = _get_conn()
    try:
        sql = "SELECT * FROM reports"
        params = []
        conditions = []
        if tipo:
            conditions.append("json_extract(payload, '$.datos_evento.tipo_incidente') = ?")
            params.append(tipo)
        if verification == "pending":
            conditions.append("admin_verification IS NULL")
        elif verification == "verified":
            conditions.append("admin_verification = 'verified'")
        elif verification == "rejected":
            conditions.append("admin_verification = 'rejected'")
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)
        sql += " ORDER BY id DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(sql, params).fetchall()
        result = []
        for r in rows:
            result.append({
                "id": r["id"],
                "reporte_id": r["reporte_id"],
                "payload": json.loads(r["payload"]),
                "audit": json.loads(r["audit"]),
                "admin_verification": r["admin_verification"],
                "created_at": r["created_at"],
            })
        return result
    finally:
        conn.close()
