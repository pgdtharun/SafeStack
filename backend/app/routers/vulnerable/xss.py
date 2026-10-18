"""Vulnerable Cross-Site Scripting (XSS) router.

Stores the comment body exactly as supplied — no escaping, no sanitisation.
If a browser renders the returned body as HTML, any injected <script> tag
or event-handler attribute will execute.
"""

import sqlite3

from fastapi import APIRouter, Depends

from app.db import get_db
from app.schemas import CommentRequest, ResponseEnvelope

router = APIRouter()

_INSERT = "INSERT INTO comments (author, body) VALUES (?, ?)"
_SELECT = "SELECT * FROM comments WHERE id = ?"


@router.post("/comment", response_model=ResponseEnvelope)
def comment(payload: CommentRequest, db: sqlite3.Connection = Depends(get_db)):
    """Vulnerable XSS: body stored and returned raw — no HTML escaping.

    Attack example:
        body = <script>alert(1)</script>
        → stored verbatim, returned verbatim; executes in the browser.
    """
    # ⚠️  INTENTIONALLY VULNERABLE — body is never escaped
    author = payload.author
    body = payload.body  # raw, untouched

    cursor = db.execute(_INSERT, (author, body))
    db.commit()
    row = db.execute(_SELECT, (cursor.lastrowid,)).fetchone()

    # Show the INSERT with the real (unescaped) values so the UI can display
    # exactly what was written to the database.
    executed_query = (
        f"INSERT INTO comments (author, body) VALUES "
        f"('{author}', '{body}')"
    )

    return ResponseEnvelope(
        status=200,
        data=dict(row),
        mode="vulnerable",
        executed_query=executed_query,
    )
