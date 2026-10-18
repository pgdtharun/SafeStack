"""Database management using raw sqlite3 (no ORM)."""

import os
import sqlite3
from pathlib import Path
from typing import Generator, Optional, Union

# Database file location
BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "safestack.db"
DB_PATH = Path(
    os.environ.get("SAFESTACK_DB_PATH", os.environ.get("DATABASE_PATH", str(DEFAULT_DB_PATH)))
)
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def reset_db(db_path: Optional[Union[str, Path]] = None) -> None:
    """Reset the database using raw sqlite3 and the DDL / seed data in schema.sql."""
    target_path = Path(db_path) if db_path else DB_PATH
    target_path.parent.mkdir(parents=True, exist_ok=True)

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(target_path)
    try:
        conn.execute("PRAGMA foreign_keys = OFF;")
        conn.executescript(schema_sql)
        conn.commit()
    finally:
        conn.close()


def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI dependency yielding a raw sqlite3 database connection.

    Uses sqlite3.Row factory so rows can be accessed both by index and column name.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()


if __name__ == "__main__":
    reset_db()
    print(f"Database successfully reset at: {DB_PATH}")
