"""Secure SQL-injection login router.

Uses a parameterized query (? placeholders) so user input is never
interpreted as SQL. Passwords are compared as SHA-256 hex digests —
the seed data in schema.sql stores the same hashes.
"""

import hashlib
import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.schemas import LoginRequest, ResponseEnvelope

router = APIRouter()

# Template shown to the UI — placeholders remain visible so learners can
# see the contrast with the vulnerable f-string version.
_QUERY_TEMPLATE = (
    "SELECT * FROM users WHERE username = ? AND password_hash = ?"
)


def _sha256(value: str) -> str:
    """Return the lowercase hex SHA-256 digest of *value*."""
    return hashlib.sha256(value.encode()).hexdigest()


@router.post("/login", response_model=ResponseEnvelope)
def login(payload: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    """Secure login: parameterized query + hashed password comparison.

    User input is passed as bound parameters, never interpolated into SQL.
    The password is hashed before comparison so plaintext is never stored or
    compared directly.
    """
    password_hash = _sha256(payload.password)

    row = db.execute(
        _QUERY_TEMPLATE,
        (payload.username, password_hash),
    ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=401,
            detail={
                "status": 401,
                "data": None,
                "mode": "secure",
                # Show the template (with placeholders) — never the real values
                "executed_query": _QUERY_TEMPLATE,
            },
        )

    return ResponseEnvelope(
        status=200,
        data=dict(row),
        mode="secure",
        executed_query=_QUERY_TEMPLATE,
    )
