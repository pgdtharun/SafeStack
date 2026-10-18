"""Integration and contract verification tests for SafeStack backend."""

import os
import sys
import tempfile
import unittest
from pathlib import Path

# Set test database path before importing app modules
test_db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
test_db_path = Path(test_db_file.name)
test_db_file.close()

os.environ["SAFESTACK_DB_PATH"] = str(test_db_path)

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.db import get_db, reset_db
from app.main import app


class TestSafeStackContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        reset_db(test_db_path)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        if test_db_path.exists():
            try:
                test_db_path.unlink()
            except OSError:
                pass

    def test_database_seed_data(self):
        """Verify schema.sql and reset_db seed users and invoices correctly."""
        db_gen = get_db()
        conn = next(db_gen)
        try:
            users = conn.execute("SELECT id, username, role FROM users ORDER BY id").fetchall()
            self.assertEqual(len(users), 2)
            self.assertEqual(users[0]["username"], "alice")
            self.assertEqual(users[1]["username"], "bob")

            invoices = conn.execute("SELECT id, owner_id, amount FROM invoices ORDER BY id").fetchall()
            self.assertEqual(len(invoices), 2)
            self.assertEqual(invoices[0]["id"], 101)
            self.assertEqual(invoices[0]["owner_id"], 1)
            self.assertEqual(invoices[1]["id"], 102)
            self.assertEqual(invoices[1]["owner_id"], 2)
        finally:
            try:
                next(db_gen)
            except StopIteration:
                pass

    def _assert_envelope(self, payload: dict, expected_mode: str = None):
        self.assertIn("status", payload)
        self.assertIn("data", payload)
        self.assertIn("mode", payload)
        self.assertIn("executed_query", payload)
        self.assertEqual(payload["status"], 200)
        if expected_mode:
            self.assertEqual(payload["mode"], expected_mode)

    def test_reset_endpoint(self):
        """POST /api/reset"""
        res = self.client.post("/api/reset")
        self.assertEqual(res.status_code, 200)
        self._assert_envelope(res.json())

    def test_sqli_endpoints(self):
        """POST /api/{mode}/sqli/login"""
        body = {"username": "admin", "password": "password123"}

        # Vulnerable
        res_vuln = self.client.post("/api/vulnerable/sqli/login", json=body)
        self.assertEqual(res_vuln.status_code, 200)
        self._assert_envelope(res_vuln.json(), expected_mode="vulnerable")

        # Secure
        res_sec = self.client.post("/api/secure/sqli/login", json=body)
        self.assertEqual(res_sec.status_code, 200)
        self._assert_envelope(res_sec.json(), expected_mode="secure")

    def test_xss_endpoints(self):
        """POST /api/{mode}/xss/comment"""
        body = {"author": "attacker", "body": "<script>alert(1)</script>"}

        # Vulnerable
        res_vuln = self.client.post("/api/vulnerable/xss/comment", json=body)
        self.assertEqual(res_vuln.status_code, 200)
        self._assert_envelope(res_vuln.json(), expected_mode="vulnerable")

        # Secure
        res_sec = self.client.post("/api/secure/xss/comment", json=body)
        self.assertEqual(res_sec.status_code, 200)
        self._assert_envelope(res_sec.json(), expected_mode="secure")

    def test_bola_endpoints(self):
        """GET /api/{mode}/bola/invoice"""
        # Vulnerable
        res_vuln = self.client.get("/api/vulnerable/bola/invoice", params={"id": 101, "as_user": "2"})
        self.assertEqual(res_vuln.status_code, 200)
        self._assert_envelope(res_vuln.json(), expected_mode="vulnerable")

        # Secure
        res_sec = self.client.get("/api/secure/bola/invoice", params={"id": 101, "as_user": "2"})
        self.assertEqual(res_sec.status_code, 200)
        self._assert_envelope(res_sec.json(), expected_mode="secure")

    def test_cors_headers(self):
        """CORS allow-all for local dev"""
        res = self.client.options(
            "/api/reset",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )
        self.assertEqual(res.headers.get("access-control-allow-origin"), "http://localhost:5173")


if __name__ == "__main__":
    unittest.main()
