"""Security-headers middleware — applied only to /api/secure/* responses.

Implemented as a raw ASGI middleware (not BaseHTTPMiddleware) so it
intercepts the ``http.response.start`` message and injects headers *before*
any bytes are sent to the client.  This works correctly with FastAPI's
JSONResponse, StreamingResponse, and error responses alike.

The vulnerable routes are deliberately left unprotected so the SafeStack
demo can contrast header presence vs. absence in the browser DevTools and
the smoke tests.

Headers added to every /api/secure/* response:
    Content-Security-Policy : default-src 'self'
    X-Content-Type-Options  : nosniff
    X-Frame-Options         : DENY
"""

from typing import Callable

# The path prefix that triggers header injection.
_SECURE_PREFIX = "/api/secure/"

# Headers to inject — defined once so the smoke test can import and verify
# the same values without duplicating magic strings.
SECURITY_HEADERS: dict[str, str] = {
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
}

# Pre-encode as (name_bytes, value_bytes) tuples for the ASGI send hook.
_ENCODED_HEADERS: list[tuple[bytes, bytes]] = [
    (k.lower().encode(), v.encode())
    for k, v in SECURITY_HEADERS.items()
]


class SecurityHeadersMiddleware:
    """Pure ASGI middleware that injects security headers on /api/secure/* responses.

    Uses the raw ASGI interface rather than BaseHTTPMiddleware so headers are
    injected into the ``http.response.start`` event — guaranteed to fire before
    any body bytes reach the client, regardless of response type.
    """

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            # Pass non-HTTP scopes (websocket, lifespan) straight through.
            await self.app(scope, receive, send)
            return

        path: str = scope.get("path", "")
        inject = path.startswith(_SECURE_PREFIX)

        if not inject:
            await self.app(scope, receive, send)
            return

        # Wrap the send callable to intercept response.start and add headers.
        async def send_with_headers(message) -> None:
            if message["type"] == "http.response.start":
                # Append our headers; cast to list for mutability.
                headers = list(message.get("headers", []))
                # Only add headers that aren't already set (don't override).
                existing = {name.lower() for name, _ in headers}
                for name_b, value_b in _ENCODED_HEADERS:
                    if name_b not in existing:
                        headers.append((name_b, value_b))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_headers)
