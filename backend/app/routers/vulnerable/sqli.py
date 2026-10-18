"""Vulnerable SQL injection router stub."""

import sqlite3
from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import LoginRequest, ResponseEnvelope

router = APIRouter()


@router.post("/login", response_model=ResponseEnvelope)
def login(payload: LoginRequest, db: sqlite3.Connection = Depends(get_db)):
    """TODO: Implement vulnerable SQL injection login."""
    return {
        "status": 200,
        "data": None,
        "mode": "vulnerable",
        "executed_query": None,
    }
