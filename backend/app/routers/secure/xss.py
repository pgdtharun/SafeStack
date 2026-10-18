"""Secure Cross-Site Scripting (XSS) router.

Passes the comment body (and author) through html.escape() before storing.
Angle brackets, quotes, and ampersands are converted to HTML entities so
the stored string is safe to render verbatim in an HTML context without
a JS-based sanitisation library.
"""

import html
import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import CommentRequest, ResponseEnvelope

router = APIRouter()

_INSERT = "INSERT INTO comments (author, body) VALUES (?, ?)"
_SELECT = "SELECT * FROM comments WHERE id = ?"


@router.post("/comment", response_model=ResponseEnvelope)
def comment(payload: CommentRequest, db: sqlite3.Connection = Depends(get_db)):
    """Secure XSS: body is HTML-escaped before storage and return.

    html.escape() converts the five dangerous characters:
        &  →  &amp;
        <  →  &lt;
        >  →  &gt;
        "  →  &quot;
        '  →  &#x27;

    Attack example:
        body = <script>alert(1)</script>
        → stored as &lt;script&gt;alert(1)&lt;/script&gt;
        → renders as plain text in the browser, never executes.
    """
    # Escape both fields — author could also carry injected markup
    author = html.escape(payload.author, quote=True)
    body = html.escape(payload.body, quote=True)

    cursor = db.execute(_INSERT, (author, body))
    db.commit()
    row = db.execute(_SELECT, (cursor.lastrowid,)).fetchone()

    # Show the INSERT with the already-escaped values so the UI diff is clear.
    executed_query = (
        f"INSERT INTO comments (author, body) VALUES "
        f"('{author}', '{body}')"
    )

    return ResponseEnvelope(
        status=200,
        data=dict(row),
        mode="secure",
        executed_query=executed_query,
    )
