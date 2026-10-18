"""Pydantic schemas matching the docs/CONTRACT.md specification."""

from typing import Any, Optional
from pydantic import BaseModel, ConfigDict


class ResponseEnvelope(BaseModel):
    """Universal response envelope matching docs/CONTRACT.md."""

    model_config = ConfigDict(extra="ignore")

    status: int = 200
    data: Any = None
    mode: Optional[str] = None
    executed_query: Optional[str] = None


class LoginRequest(BaseModel):
    """Request payload for /api/{mode}/sqli/login."""

    username: str
    password: str


class CommentRequest(BaseModel):
    """Request payload for /api/{mode}/xss/comment."""

    author: str
    body: str
