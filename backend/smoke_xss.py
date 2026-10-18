"""Smoke tests for XSS endpoints — run directly with: py smoke_xss.py"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8001"

SCRIPT_PAYLOAD  = "<script>alert(1)</script>"
IMG_PAYLOAD     = '<img src=x onerror=alert(2)>'
PLAIN_COMMENT   = "Just a normal comment."

SCRIPT_ESCAPED  = "&lt;script&gt;alert(1)&lt;/script&gt;"
IMG_ESCAPED     = "&lt;img src=x onerror=alert(2)&gt;"


def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        BASE + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def show(label, status, body):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  HTTP {status}")
    print(json.dumps(body, indent=2))


# ── Reset ────────────────────────────────────────────────────
status, body = post("/api/reset", {})
show("POST /api/reset", status, body)
assert status == 200

# ── 1. VULNERABLE: <script> payload stored & returned raw ────
status, body = post(
    "/api/vulnerable/xss/comment",
    {"author": "eve", "body": SCRIPT_PAYLOAD},
)
show("VULNERABLE  <script>alert(1)</script>  (expect raw)", status, body)
assert status == 200, f"Expected 200, got {status}"
returned_body = body["data"]["body"]
assert returned_body == SCRIPT_PAYLOAD, (
    f"Expected raw payload, got: {returned_body}"
)
assert SCRIPT_PAYLOAD in body["executed_query"], "Raw payload must appear in executed_query"
print(f"  [OK] body returned RAW: {returned_body!r}")

# ── 2. VULNERABLE: img onerror payload stored & returned raw ─
status, body = post(
    "/api/vulnerable/xss/comment",
    {"author": "eve", "body": IMG_PAYLOAD},
)
show("VULNERABLE  img onerror payload  (expect raw)", status, body)
assert status == 200
assert body["data"]["body"] == IMG_PAYLOAD
print(f"  [OK] body returned RAW: {body['data']['body']!r}")

# ── 3. VULNERABLE: plain text passes through unchanged ───────
status, body = post(
    "/api/vulnerable/xss/comment",
    {"author": "alice", "body": PLAIN_COMMENT},
)
show("VULNERABLE  plain text  (expect unchanged)", status, body)
assert status == 200
assert body["data"]["body"] == PLAIN_COMMENT
print(f"  [OK] plain text unchanged: {body['data']['body']!r}")

# ── 4. SECURE: <script> payload escaped ─────────────────────
status, body = post(
    "/api/secure/xss/comment",
    {"author": "eve", "body": SCRIPT_PAYLOAD},
)
show("SECURE  <script>alert(1)</script>  (expect HTML-escaped)", status, body)
assert status == 200, f"Expected 200, got {status}"
returned_body = body["data"]["body"]
assert returned_body == SCRIPT_ESCAPED, (
    f"Expected escaped payload, got: {returned_body}"
)
assert SCRIPT_ESCAPED in body["executed_query"], "Escaped form must appear in executed_query"
assert "<script>" not in returned_body, "Raw <script> must NOT appear in secure response"
print(f"  [OK] body escaped: {returned_body!r}")

# ── 5. SECURE: img onerror payload escaped ───────────────────
status, body = post(
    "/api/secure/xss/comment",
    {"author": "eve", "body": IMG_PAYLOAD},
)
show("SECURE  img onerror payload  (expect HTML-escaped)", status, body)
assert status == 200
returned_body = body["data"]["body"]
assert returned_body == IMG_ESCAPED
assert "onerror=" not in returned_body or "&lt;" in returned_body
print(f"  [OK] body escaped: {returned_body!r}")

# ── 6. SECURE: author field is also escaped ──────────────────
status, body = post(
    "/api/secure/xss/comment",
    {"author": '<b>bold</b>', "body": PLAIN_COMMENT},
)
show("SECURE  XSS in author field  (expect escaped)", status, body)
assert status == 200
returned_author = body["data"]["author"]
assert "<b>" not in returned_author, "Raw tags must NOT appear in author"
assert "&lt;b&gt;" in returned_author
print(f"  [OK] author escaped: {returned_author!r}")

# ── 7. SECURE: plain text passes through unchanged ───────────
status, body = post(
    "/api/secure/xss/comment",
    {"author": "alice", "body": PLAIN_COMMENT},
)
show("SECURE  plain text  (expect unchanged)", status, body)
assert status == 200
assert body["data"]["body"] == PLAIN_COMMENT
print(f"  [OK] plain text unchanged: {body['data']['body']!r}")

print("\n\nAll assertions passed.")
