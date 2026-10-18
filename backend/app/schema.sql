-- SafeStack Database Schema (Raw SQLite3 per docs/CONTRACT.md)

DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password      TEXT NOT NULL,          -- plaintext (vulnerable demo only)
    password_hash TEXT NOT NULL,          -- SHA-256 hex digest (secure demo)
    role TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE invoices (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    body TEXT NOT NULL
);

-- Seed data per docs/CONTRACT.md
-- users: 1=alice, 2=bob  (passwords are SHA-256 of the username for demo purposes)
-- invoices: 101 owned by alice, 102 owned by bob
--
-- Vulnerable router compares the raw password string directly (SQLi demo).
-- Secure router hashes the submitted password with SHA-256 before comparing.
--   alice password: "alice"  sha256 → 2bd806c9...
--   bob   password: "bob"    sha256 → 81b637d8...
INSERT INTO users (id, username, password, password_hash, role) VALUES
    (1, 'alice', 'alice', '2bd806c97f0e00af1a1fc3328fa763a9269723c8db8fac4f93af71db186d6e90', 'admin'),
    (2, 'bob',   'bob',   '81b637d8fcd2c6da6359e6963113a1170de795e4b725b84d1e0b4cfd9ec58ce9', 'user');

INSERT INTO invoices (id, owner_id, amount, description) VALUES
    (101, 1, 500.0, 'Invoice for Alice'),
    (102, 2, 750.0, 'Invoice for Bob');
