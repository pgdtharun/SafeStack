"""Smoke tests for BOLA endpoints — run directly with: py smoke_bola.py"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8001"


def get(path):
    req = urllib.request.Request(BASE + path, method="GET")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def post(path, body=None):
    data = json.dumps(body or {}).encode()
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


# ── Reset DB ────────────────────────────────────────────────
status, body = post("/api/reset")
show("POST /api/reset", status, body)
assert status == 200

# ── Seed reminder ───────────────────────────────────────────
# invoices: 101 owned by alice (user_id=1), 102 owned by bob (user_id=2)

# 1. VULNERABLE: alice fetches her own invoice (101) — should succeed
status, body = get("/api/vulnerable/bola/invoice?id=101&as_user=alice")
show("VULNERABLE  alice fetches own invoice 101  (expect 200)", status, body)
assert status == 200, f"Expected 200, got {status}"
assert body["data"]["id"] == 101
assert "101" in body["executed_query"]            # id baked into query text

# 2. VULNERABLE: alice fetches BOB's invoice (102) — should ALSO succeed (exploit)
status, body = get("/api/vulnerable/bola/invoice?id=102&as_user=alice")
show("VULNERABLE  alice fetches Bob's invoice 102  (expect 200 - BOLA exploit)", status, body)
assert status == 200, f"Exploit should succeed on vulnerable endpoint, got {status}"
assert body["data"]["id"] == 102                  # Bob's invoice returned to alice
assert "102" in body["executed_query"]

# 3. VULNERABLE: missing invoice → 404
status, body = get("/api/vulnerable/bola/invoice?id=999&as_user=alice")
show("VULNERABLE  non-existent invoice 999  (expect 404)", status, body)
assert status == 404, f"Expected 404, got {status}"

# 4. SECURE: alice fetches her own invoice (101) — should succeed
status, body = get("/api/secure/bola/invoice?id=101&as_user=alice")
show("SECURE      alice fetches own invoice 101  (expect 200)", status, body)
assert status == 200, f"Expected 200, got {status}"
assert body["data"]["id"] == 101
assert "?" in body["executed_query"]              # placeholders, not values

# 5. SECURE: alice fetches BOB's invoice (102) — must be blocked
status, body = get("/api/secure/bola/invoice?id=102&as_user=alice")
show("SECURE      alice fetches Bob's invoice 102  (expect 403 - blocked)", status, body)
assert status == 403, f"BOLA must be blocked on secure endpoint, got {status}"

# 6. SECURE: bob fetches his own invoice (102) — should succeed
status, body = get("/api/secure/bola/invoice?id=102&as_user=bob")
show("SECURE      bob fetches own invoice 102  (expect 200)", status, body)
assert status == 200, f"Expected 200, got {status}"
assert body["data"]["id"] == 102

# 7. SECURE: missing invoice → 404
status, body = get("/api/secure/bola/invoice?id=999&as_user=alice")
show("SECURE      non-existent invoice 999  (expect 404)", status, body)
assert status == 404, f"Expected 404, got {status}"

print("\n\nAll assertions passed.")
