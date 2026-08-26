"""Acesso à memória persistente em SQLite (outros bancos exigem autenticação)."""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

_MEMORY_DB = Path(__file__).resolve().parent.parent.parent.parent / "data" / "memory.db"


def _conn(db_path: str | None = None) -> sqlite3.Connection:
    path = Path(db_path) if db_path else _MEMORY_DB
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT, updated_at TEXT)"
    )
    return conn


def memory_set(key: str, value: str, db_path: str | None = None) -> None:
    conn = _conn(db_path)
    try:
        conn.execute(
            "INSERT INTO kv(key, value, updated_at) VALUES(?,?,?) "
            "ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
            (key, value, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def memory_get(key: str, db_path: str | None = None) -> str | None:
    conn = _conn(db_path)
    try:
        row = conn.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
        return row[0] if row else None
    finally:
        conn.close()


def memory_list(db_path: str | None = None) -> list[dict]:
    conn = _conn(db_path)
    try:
        rows = conn.execute("SELECT key, value, updated_at FROM kv ORDER BY key").fetchall()
        return [{"key": r[0], "value": r[1], "updated_at": r[2]} for r in rows]
    finally:
        conn.close()
