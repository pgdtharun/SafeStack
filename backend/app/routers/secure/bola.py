"""Secure BOLA (Broken Object Level Authorization) invoice router.

Fetches an invoice only if the requesting user actually owns it.
The check is performed in a single JOIN so there is no TOCTOU window
and the ownership comparison never leaves the database.
"""

import sqlite3
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.db import get_db
from app.schemas import ResponseEnvelope

router = APIRouter()

# Parameterized template — shown to the UI so learners see the contrast
# with the vulnerable version (which hard-codes the id into the SQL text).
_QUERY_TEMPLATE = (
    "SELECT i.* FROM invoices i "
    "JOIN users u ON i.owner_id = u.id "
    "WHERE i.id = ? AND u.username = ?"
)


@router.get("/invoice", response_model=ResponseEnvelope)
def get_invoice(
    id: Optional[int] = Query(default=None, description="Invoice ID"),
    as_user: Optional[str] = Query(
        default=None,
        description="Simulated current user — ownership enforced server-side",
    ),
    db: sqlite3.Connection = Depends(get_db),
):
    """Secure BOLA: invoice is only returned when as_user owns it.

    The JOIN ensures owner_id == users.id for the given username in one
    atomic query.  If the invoice exists but belongs to a different user
    the row simply won't match and we return 403.
    """
    if id is None or as_user is None:
        raise HTTPException(
            status_code=422,
            detail={
                "status": 422,
                "data": None,
                "mode": "secure",
                "executed_query": None,
                "error": "Query parameters 'id' and 'as_user' are both required.",
            },
        )

    # First check the invoice exists at all (so we can distinguish 404 vs 403)
    invoice = db.execute(
        "SELECT * FROM invoices WHERE id = ?", (id,)
    ).fetchone()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail={
                "status": 404,
                "data": None,
                "mode": "secure",
                "executed_query": _QUERY_TEMPLATE,
            },
        )

    # Ownership check: only succeeds if as_user is the actual owner
    row = db.execute(_QUERY_TEMPLATE, (id, as_user)).fetchone()

    if row is None:
        # Invoice exists but requester does not own it → 403 Forbidden
        raise HTTPException(
            status_code=403,
            detail={
                "status": 403,
                "data": None,
                "mode": "secure",
                "executed_query": _QUERY_TEMPLATE,
            },
        )

    return ResponseEnvelope(
        status=200,
        data=dict(row),
        mode="secure",
        executed_query=_QUERY_TEMPLATE,
    )
