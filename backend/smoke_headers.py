"""Smoke tests for security-header middleware.

Verifies that every /api/secure/* response carries the three required
security headers, and that /api/vulnerable/* responses deliberately do NOT.

Run with: py smoke_headers.py
"""

import json
import urllib.request
import urllib.error
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from app.middleware.security_headers import SECURITY_HEADERS

BASE = "http://localhost:8001"

# ── helpers ───────────────────────────────────────────────────────────────────

def http_post(path: str, body: dict) -> tuple[int, dict, dict]:
    """Return (status, response_body_dict, lowercase_headers_dict)."""
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            # Normalise to lowercase so we match what the server sends
            return r.status, json.loads(r.read()), {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()), {k.lower(): v for k, v in e.headers.items()}


def http_get(path: str) -> tuple[int, dict, dict]:
    """Return (status, response_body_dict, lowercase_headers_dict)."""
    req = urllib.request.Request(BASE + path, method="GET")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read()), {k.lower(): v for k, v in r.headers.items()}
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()), {k.lower(): v for k, v in e.headers.items()}


def show(label: str, status: int, headers: dict) -> None:
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  HTTP {status}")
    for h in SECURITY_HEADERS:
        val = headers.get(h.lower(), "<absent>")
        marker = "[OK]" if val != "<absent>" else "[--]"
        print(f"  {marker} {h}: {val}")


def assert_headers_present(headers: dict, context: str) -> None:
    """Assert all SECURITY_HEADERS are in the response (case-insensitive)."""
    for header, expected_value in SECURITY_HEADERS.items():
        actual = headers.get(header.lower())
        assert actual is not None, (
            f"[{context}] Missing header: {header}"
        )
        assert actual == expected_value, (
            f"[{context}] {header}: expected {expected_value!r}, got {actual!r}"
        )


def assert_headers_absent(headers: dict, context: str) -> None:
    """Assert none of the SECURITY_HEADERS appear in the response."""
    for header in SECURITY_HEADERS:
        actual = headers.get(header.lower())
        assert actual is None, (
            f"[{context}] Header should be ABSENT on vulnerable/system route: "
            f"{header} = {actual!r}"
        )


# ── reset ─────────────────────────────────────────────────────────────────────
status, body, hdrs = http_post("/api/reset", {})
show("POST /api/reset", status, hdrs)
assert status == 200

# ── secure endpoints — headers MUST be present ────────────────────────────────

status, body, hdrs = http_post(
    "/api/secure/sqli/login", {"username": "alice", "password": "alice"}
)
show("SECURE  POST /api/secure/sqli/login  (headers must be present)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_present(hdrs, "secure sqli login")

status, body, hdrs = http_post(
    "/api/secure/xss/comment", {"author": "alice", "body": "hello"}
)
show("SECURE  POST /api/secure/xss/comment  (headers must be present)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_present(hdrs, "secure xss comment")

status, body, hdrs = http_get("/api/secure/bola/invoice?id=101&as_user=alice")
show("SECURE  GET /api/secure/bola/invoice  (headers must be present)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_present(hdrs, "secure bola invoice")

# ── secure 401/403 — headers must ALSO be present on error responses ──────────

status, body, hdrs = http_post(
    "/api/secure/sqli/login", {"username": "alice", "password": "wrong"}
)
show("SECURE  POST /api/secure/sqli/login  401  (headers must be present)", status, hdrs)
assert status == 401, f"Expected 401, got {status}: {body}"
assert_headers_present(hdrs, "secure sqli 401")

status, body, hdrs = http_get("/api/secure/bola/invoice?id=102&as_user=alice")
show("SECURE  GET /api/secure/bola/invoice 403  (headers must be present)", status, hdrs)
assert status == 403, f"Expected 403, got {status}: {body}"
assert_headers_present(hdrs, "secure bola 403")

# ── vulnerable endpoints — headers MUST be absent ────────────────────────────

status, body, hdrs = http_post(
    "/api/vulnerable/sqli/login", {"username": "alice", "password": "alice"}
)
show("VULNERABLE  POST /api/vulnerable/sqli/login  (headers must be ABSENT)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_absent(hdrs, "vulnerable sqli login")

status, body, hdrs = http_post(
    "/api/vulnerable/xss/comment", {"author": "alice", "body": "hello"}
)
show("VULNERABLE  POST /api/vulnerable/xss/comment  (headers must be ABSENT)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_absent(hdrs, "vulnerable xss comment")

status, body, hdrs = http_get("/api/vulnerable/bola/invoice?id=101&as_user=alice")
show("VULNERABLE  GET /api/vulnerable/bola/invoice  (headers must be ABSENT)", status, hdrs)
assert status == 200, f"Expected 200, got {status}: {body}"
assert_headers_absent(hdrs, "vulnerable bola invoice")

# ── /api/reset — headers must be absent (not a /api/secure/ route) ───────────
status, body, hdrs = http_post("/api/reset", {})
show("SYSTEM  POST /api/reset  (headers must be ABSENT)", status, hdrs)
assert status == 200
assert_headers_absent(hdrs, "api/reset")

print("\n\nAll assertions passed.")
