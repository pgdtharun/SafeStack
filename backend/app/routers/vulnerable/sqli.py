"""Vulnerable SQL-injection login router.

Intentionally builds the WHERE clause by interpolating user-supplied values
directly into an f-string so the query can be trivially injected.
The executed_query string (with the real interpolated values) is returned in
the response envelope so the UI can display exactly what hit the database.
"""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.schemas import LoginRequest, ResponseEnvelope

router = APIRouter()


@router.post("/login", response_model=ResponseEnvelope)
def login(payload: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    """Vulnerable login: username and password concatenated directly into SQL.

    Attack example:
        username = alice'--
        password = anything
    Resulting query:
        SELECT * FROM users WHERE username = 'alice'--' AND password = 'anything'
    """
    # ⚠️  INTENTIONALLY VULNERABLE — never do this in production
    query = (
        f"SELECT * FROM users "
        f"WHERE username = '{payload.username}' "
        f"AND password = '{payload.password}'"
    )

    try:
        row = db.execute(query).fetchone()
    except sqlite3.OperationalError as exc:
        # Surface DB errors (e.g. from malformed injections) as 400 so the UI
        # can show them — still return the attempted query for educational value.
        raise HTTPException(
            status_code=400,
            detail={
                "status": 400,
                "data": None,
                "mode": "vulnerable",
                "executed_query": query,
                "error": str(exc),
            },
        )

    if row is None:
        raise HTTPException(
            status_code=401,
            detail={
                "status": 401,
                "data": None,
                "mode": "vulnerable",
                "executed_query": query,
            },
        )

    return ResponseEnvelope(
        status=200,
        data=dict(row),
        mode="vulnerable",
        executed_query=query,
    )
