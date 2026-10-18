-- SafeStack Database Schema (Raw SQLite3 per docs/CONTRACT.md)

DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
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
-- users: 1=alice, 2=bob
-- invoices: 101 owned by alice, 102 owned by bob
INSERT INTO users (id, username, password_hash, role) VALUES
    (1, 'alice', 'alice_password_hash', 'admin'),
    (2, 'bob', 'bob_password_hash', 'user');

INSERT INTO invoices (id, owner_id, amount, description) VALUES
    (101, 1, 500.0, 'Invoice for Alice'),
    (102, 2, 750.0, 'Invoice for Bob');
