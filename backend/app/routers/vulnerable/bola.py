"""Vulnerable BOLA (Broken Object Level Authorization) invoice router.

Fetches an invoice by ID alone — the `as_user` parameter is accepted
but completely ignored.  Any caller who knows (or guesses) an invoice ID
can read it regardless of ownership.
"""

import sqlite3
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_db
from app.schemas import ResponseEnvelope

router = APIRouter()

# Query shown to the UI so learners see exactly what the DB executed.
_QUERY = "SELECT * FROM invoices WHERE id = {id}"


@router.get("/invoice", response_model=ResponseEnvelope)
def get_invoice(
    id: Optional[int] = Query(default=None, description="Invoice ID"),
    as_user: Optional[str] = Query(
        default=None,
        description="Simulated current user — intentionally not checked",
    ),
    db: sqlite3.Connection = Depends(get_db),
):
    """Vulnerable BOLA: ownership is never verified.

    Attack example:
        GET /api/vulnerable/bola/invoice?id=102&as_user=alice
        → returns Bob's invoice because as_user is ignored entirely.
    """
    if id is None:
        raise HTTPException(
            status_code=422,
            detail={
                "status": 422,
                "data": None,
                "mode": "vulnerable",
                "executed_query": None,
                "error": "Query parameter 'id' is required.",
            },
        )

    # ⚠️  INTENTIONALLY VULNERABLE — ownership not checked
    query = _QUERY.format(id=id)
    row = db.execute(query).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": 404,
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
