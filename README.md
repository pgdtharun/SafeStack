# 🛡️ SafeStack — Vulnerable vs. Secure Code Sandbox

SafeStack is an interactive, educational security lab that puts a deliberately vulnerable web application side-by-side with its correctly implemented counterpart. You submit real exploit payloads through the UI — SQL injection strings, raw HTML/script tags, forged invoice IDs — and watch what actually happens at the database layer: the raw executed SQL query is returned in every API response, escaped output is compared directly against unescaped output, and authorization checks either fire or don't. A single toggle on each scenario switches the backend between the **vulnerable** and **secure** implementation so the difference is immediately visible without reading source code. Built as a university project for teaching three of OWASP's top API vulnerability classes.

---

## Quick Start

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) running locally.

```bash
git clone https://github.com/your-org/safestack.git
cd SafeStack
docker compose up
```

Open **http://localhost:5173** in your browser.

The backend API is available at **http://localhost:8001**. Use the **↺ Reset DB** button in the top bar to restore the seed data at any time.

---

## Vulnerabilities

### 1 — SQL Injection (SQLi)

**Endpoint:** `POST /api/{mode}/sqli/login` · body: `{ username, password }`

#### Root cause

The vulnerable endpoint builds its SQL query by concatenating user-supplied strings directly into the SQL text using a Python f-string:

```python
# routers/vulnerable/sqli.py
query = (
    f"SELECT * FROM users "
    f"WHERE username = '{payload.username}' "
    f"AND password = '{payload.password}'"
)
```

Because the database engine receives a single pre-built string, it cannot distinguish between the intended query structure and data injected by the caller. The full interpolated query is returned in `executed_query` so you can read exactly what hit the database.

#### Reproducing it

1. Toggle to **Vulnerable** mode.
2. Click the **"Auth bypass"** payload chip — it loads `alice'--` into the username field.
3. Submit with any password.
4. The `--` comments out the `AND password = '...'` clause entirely. The server returns alice's full user row. The `executed_query` field in the response shows:
   ```sql
   SELECT * FROM users WHERE username = 'alice'--' AND password = 'anything'
   ```
5. Try the **"UNION extract"** chip — payload `` ' UNION SELECT username, password_hash, null, null FROM users -- `` — to leak the entire users table into the response.

#### What the secure version does differently

```python
# routers/secure/sqli.py
_QUERY_TEMPLATE = "SELECT * FROM users WHERE username = ? AND password_hash = ?"

password_hash = hashlib.sha256(payload.password.encode()).hexdigest()
row = db.execute(_QUERY_TEMPLATE, (payload.username, password_hash)).fetchone()
```

The query structure and user data are sent as separate protocol messages via `?` placeholders. Injected SQL characters are always treated as literal data values, never as query syntax. Passwords are compared as SHA-256 hex digests — the seed stores hashes, not plaintext. The `executed_query` field always returns the template with `?` placeholders, never the real values.

---

### 2 — Cross-Site Scripting (XSS)

**Endpoint:** `POST /api/{mode}/xss/comment` · body: `{ author, body }`

#### Root cause

The vulnerable endpoint stores and returns the comment body exactly as submitted, with no HTML encoding:

```python
# routers/vulnerable/xss.py
body = payload.body  # raw, untouched
cursor = db.execute(_INSERT, (author, body))
```

When a browser renders the response inside an HTML document it interprets angle brackets as markup, so any injected `<script>` tag or event-handler attribute is treated as executable code rather than text.

#### Reproducing it

1. Toggle to **Vulnerable** mode.
2. Click the **"Script tag"** payload chip — it loads `<script>alert('XSS')</script>` into the comment body.
3. Submit. The response `data.body` contains the raw script tag verbatim. The UI renders the comment in a sandboxed iframe with `sandbox="allow-scripts"` — the alert fires.
4. Try the **"Img onerror"** chip — `<img src=x onerror=alert(1)>` — to trigger execution without a closing tag.

#### What the secure version does differently

```python
# routers/secure/xss.py
import html

author = html.escape(payload.author, quote=True)
body   = html.escape(payload.body,   quote=True)
```

Python's `html.escape()` converts `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, and `'` → `&#x27;` on both the `body` and `author` fields before storage. The stored string is safe to render in any HTML context. In the UI the escaped body renders as visible plain text rather than executing. The `executed_query` shows the already-escaped values so the contrast is visible without opening DevTools.

---

### 3 — Broken Object Level Authorization (BOLA)

**Endpoint:** `GET /api/{mode}/bola/invoice?id=&as_user=`

#### Root cause

The vulnerable endpoint fetches an invoice using only the `id` query parameter and ignores `as_user` entirely:

```python
# routers/vulnerable/bola.py
query = f"SELECT * FROM invoices WHERE id = {id}"
row = db.execute(query).fetchone()
# as_user is accepted but never read
```

Any caller who knows (or can enumerate) an invoice ID can retrieve it regardless of who it belongs to.

#### Reproducing it

1. Toggle to **Vulnerable** mode, select **Alice** as the logged-in user.
2. Click **"Bob's invoice as Alice"** — sets invoice ID to `102` (Bob's \$750 invoice, `owner_id = 2`).
3. Submit. The server returns Bob's invoice in full to Alice. The `executed_query` field shows `SELECT * FROM invoices WHERE id = 102` — no ownership check at all.
4. Switch to **Secure** mode and repeat: the server returns `403 Forbidden`.

#### What the secure version does differently

```python
# routers/secure/bola.py
_QUERY_TEMPLATE = (
    "SELECT i.* FROM invoices i "
    "JOIN users u ON i.owner_id = u.id "
    "WHERE i.id = ? AND u.username = ?"
)
row = db.execute(_QUERY_TEMPLATE, (id, as_user)).fetchone()
```

Ownership is enforced in a single atomic `JOIN` — the query only matches rows where `invoices.owner_id = users.id` for the given username. There is no separate "fetch then check" step, eliminating any time-of-check / time-of-use window. The server distinguishes `404` (invoice doesn't exist) from `403` (invoice exists but you don't own it).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [FastAPI](https://fastapi.tiangolo.com/) + raw `sqlite3` (stdlib) |
| Database | SQLite (single file, `safestack.db`) |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Orchestration | Docker Compose |

**No ORM is used by design.** Keeping the backend on raw `sqlite3` makes the contrast between string concatenation and parameterized queries maximally visible in the source — there is no abstraction layer hiding what the database actually receives. The same `executed_query` string is returned in every API response envelope so the UI can surface it directly.

**Seed data** (reset any time with `POST /api/reset`):

| Table | Rows |
|---|---|
| `users` | alice (id=1, role=admin), bob (id=2, role=user) |
| `invoices` | 101 → alice (\$500), 102 → bob (\$750) |
| `comments` | empty on reset |

Passwords for the secure endpoint are SHA-256 digests of the username (`alice` / `bob`). The vulnerable endpoint stores and compares plaintext in a separate `password` column so the SQLi demo works independently of the hashing logic.

---

## Security Headers

Every response from `/api/secure/*` includes three security headers injected by a raw ASGI middleware (`app/middleware/security_headers.py`) that intercepts the `http.response.start` event before any bytes are sent:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

Responses from `/api/vulnerable/*` deliberately omit these headers so the contrast is observable in browser DevTools → Network → Response Headers, making the security improvement tangible rather than theoretical.

---

## Project Structure

```
SafeStack/
├── docs/
│   └── CONTRACT.md               # API contract, schema, design tokens
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, router mounting, middleware
│   │   ├── db.py                 # sqlite3 connection, reset_db()
│   │   ├── schema.sql            # DDL + seed data
│   │   ├── schemas.py            # Pydantic request/response models
│   │   ├── middleware/
│   │   │   └── security_headers.py
│   │   └── routers/
│   │       ├── vulnerable/       # sqli.py · xss.py · bola.py
│   │       └── secure/           # sqli.py · xss.py · bola.py
│   └── tests/
│       └── test_api.py
├── frontend/
│   └── src/
│       ├── api/                  # callApi() client + TypeScript types
│       ├── components/           # PayloadChip, ResponsePanel
│       ├── scenarios/            # SqliScenario, XssScenario, BolaScenario
│       ├── data/
│       │   ├── payloads.ts       # Pre-built exploit payloads
│       │   └── explanations.ts   # Root cause / impact / fix copy
│       └── state/
├── smoke_sqli.py                 # Stdlib smoke tests (no httpx needed)
├── smoke_xss.py
├── smoke_bola.py
├── smoke_headers.py
└── .gitignore
```

---

## ⚠️ Disclaimer

SafeStack is **intentionally vulnerable**. It is designed for local, educational use in a controlled environment. Do not deploy it on a public server, expose it to a network you do not control, or use it with real user data. The vulnerable endpoints perform real SQL injection, store unescaped HTML, and skip authorization checks — that is the point. Keep Docker's port bindings local (`127.0.0.1`) and treat this like any other CTF / lab environment.
