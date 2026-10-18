"""Smoke tests for SQLi endpoints — run directly with: py smoke_sqli.py"""
import json
import urllib.request
import urllib.error

BASE = "http://localhost:8001"


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


# 1. Reset DB
status, body = post("/api/reset", {})
show("POST /api/reset", status, body)

# 2. Vulnerable — valid credentials
status, body = post("/api/vulnerable/sqli/login", {"username": "alice", "password": "alice"})
show("VULNERABLE  valid login  alice / alice", status, body)
assert status == 200, f"Expected 200, got {status}"
assert body["data"]["username"] == "alice"
assert "alice" in body["executed_query"]            # raw value visible in query

# 3. Vulnerable — classic injection bypass  alice'-- / anything
status, body = post("/api/vulnerable/sqli/login", {"username": "alice'--", "password": "x"})
show("VULNERABLE  SQLi bypass  alice'-- / x", status, body)
assert status == 200, f"Injection should bypass auth, got {status}"
assert body["data"]["username"] == "alice"
assert "alice'--" in body["executed_query"]         # injected string visible

# 4. Secure — valid credentials
status, body = post("/api/secure/sqli/login", {"username": "alice", "password": "alice"})
show("SECURE      valid login  alice / alice", status, body)
assert status == 200, f"Expected 200, got {status}"
assert body["data"]["username"] == "alice"
assert "?" in body["executed_query"]                # placeholders, not values

# 5. Secure — same injection attempt must be rejected
status, body = post("/api/secure/sqli/login", {"username": "alice'--", "password": "x"})
show("SECURE      SQLi attempt alice'-- / x  (expect 401)", status, body)
assert status == 401, f"Injection must NOT bypass secure endpoint, got {status}"

print("\n\n✅  All assertions passed.")
