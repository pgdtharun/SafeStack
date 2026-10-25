"""SafeStack FastAPI backend application."""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend root is on sys.path so 'app' imports resolve regardless of cwd
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import DB_PATH, reset_db
from app.schemas import ResponseEnvelope
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers.vulnerable import sqli as vulnerable_sqli
from app.routers.vulnerable import xss as vulnerable_xss
from app.routers.vulnerable import bola as vulnerable_bola
from app.routers.secure import sqli as secure_sqli
from app.routers.secure import xss as secure_xss
from app.routers.secure import bola as secure_bola


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup if not present."""
    if not DB_PATH.exists():
        reset_db()
    yield


app = FastAPI(
    title="SafeStack API",
    description="API backend for SafeStack security playground per docs/CONTRACT.md",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS allow-all for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inject security headers on all /api/secure/* responses only
# (vulnerable routes are deliberately left without them for the demo)
app.add_middleware(SecurityHeadersMiddleware)


@app.post("/api/reset", response_model=ResponseEnvelope, tags=["system"])
def reset():
    """Reset the database to initial seed state."""
    reset_db()
    return {
        "status": 200,
        "data": {"message": "Database reset successfully"},
        "mode": "system",
        "executed_query": None,
    }


# Mount routers at the prefixes defined in docs/CONTRACT.md
app.include_router(
    vulnerable_sqli.router,
    prefix="/api/vulnerable/sqli",
    tags=["vulnerable-sqli"],
)
app.include_router(
    vulnerable_xss.router,
    prefix="/api/vulnerable/xss",
    tags=["vulnerable-xss"],
)
app.include_router(
    vulnerable_bola.router,
    prefix="/api/vulnerable/bola",
    tags=["vulnerable-bola"],
)

app.include_router(
    secure_sqli.router,
    prefix="/api/secure/sqli",
    tags=["secure-sqli"],
)
app.include_router(
    secure_xss.router,
    prefix="/api/secure/xss",
    tags=["secure-xss"],
)
app.include_router(
    secure_bola.router,
    prefix="/api/secure/bola",
    tags=["secure-bola"],
)
