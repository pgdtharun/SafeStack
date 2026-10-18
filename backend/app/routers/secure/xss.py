"""Secure Cross-Site Scripting (XSS) router stub."""

import sqlite3
from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import CommentRequest, ResponseEnvelope

router = APIRouter()


@router.post("/comment", response_model=ResponseEnvelope)
def comment(payload: CommentRequest, db: sqlite3.Connection = Depends(get_db)):
    """TODO: Implement secure sanitized/escaped XSS comment submission."""
    return {
        "status": 200,
        "data": None,
        "mode": "secure",
        "executed_query": None,
    }
