# Contract

## Endpoints
```
POST /api/{mode}/sqli/login      body: {username, password}
POST /api/{mode}/xss/comment     body: {author, body}
GET  /api/{mode}/bola/invoice    query: ?id=&as_user=
POST /api/reset
```

`mode = "vulnerable" | "secure"`

## Response envelope (every endpoint)
```json
{
  "status": 200,
  "data": "<row or null>",
  "mode": "vulnerable | secure",
  "executed_query": "<string> | null"
}
```

## Schema
```
users(id, username, password_hash, role)
invoices(id, owner_id, amount, description)
comments(id, author, body)
```

## Seed data
```
users:    1=alice, 2=bob
invoices: 101 owned by alice, 102 owned by bob
```

## Design tokens (Option B)

| Token        | Value                     |
|--------------|---------------------------|
| bg           | `#121417`                 |
| panel        | `#15171B`                 |
| sidebar      | `#1C1F24`                 |
| border       | `#22262B`                 |
| text         | `#ECECEA`                 |
| text-dim     | `#7C7C77`                 |
| accent       | `#E8A33D`                 |
| success      | `#2F7A4F` / `#5BBE88`     |
| danger       | `#C9402B`                 |
| font-ui      | `'Space Grotesk'`         |
| font-code    | `'JetBrains Mono'`        |
