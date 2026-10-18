"""Vulnerable Broken Object Level Authorization (BOLA) router stub."""

import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.db import get_db
from app.schemas import ResponseEnvelope

router = APIRouter()


@router.get("/invoice", response_model=ResponseEnvelope)
def get_invoice(
    id: Optional[int] = Query(default=None, description="Invoice ID"),
    as_user: Optional[str] = Query(
        default=None, description="User ID or username simulating current user context"
    ),
    db: sqlite3.Connection = Depends(get_db),
):
    """TODO: Implement vulnerable BOLA invoice retrieval (missing object-level authorization check)."""
    return {
        "status": 200,
        "data": None,
        "mode": "vulnerable",
        "executed_query": None,
    }
