# LandChain Database

PostgreSQL 15+ database layer for the LandChain platform.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Schema Overview](#schema-overview)
- [Quick Setup](#quick-setup)
- [Running Migrations](#running-migrations)
- [Seed Data](#seed-data)
- [Connecting from the Backend](#connecting-from-the-backend)
- [Useful Queries](#useful-queries)
- [Schema Diagram](#schema-diagram)

---

## Prerequisites

| Requirement | Version |
|-------------|---------|
| PostgreSQL  | ≥ 15    |
| psql CLI    | ≥ 15    |

Install PostgreSQL on Ubuntu/Debian:

```bash
sudo apt-get update && sudo apt-get install -y postgresql-15 postgresql-client-15
```

Or use Docker (recommended for local development):

```bash
docker run -d \
  --name landchain-postgres \
  -e POSTGRES_USER=landchain \
  -e POSTGRES_PASSWORD=landchain_secret \
  -e POSTGRES_DB=landchain \
  -p 5432:5432 \
  postgres:15
```

---

## Schema Overview

| Table             | Purpose                                              |
|-------------------|------------------------------------------------------|
| `users`           | All platform users (citizens, officers, banks, admin)|
| `properties`      | Registered land parcels                              |
| `ownership_history` | Immutable audit trail of every ownership change   |
| `transactions`    | Multi-step property transfer workflow                |
| `documents`       | IPFS-linked title documents and supporting files     |
| `mortgages`       | Active and historical mortgage records               |
| `tax_records`     | Annual property tax records                          |
| `approvals`       | Officer approval workflow for transfers/mutations    |
| `audit_logs`      | System-wide audit log                                |

---

## Quick Setup

### 1. Create the database

```bash
# As the postgres superuser
psql -U postgres -c "CREATE USER landchain WITH PASSWORD 'landchain_secret';"
psql -U postgres -c "CREATE DATABASE landchain OWNER landchain;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE landchain TO landchain;"
```

### 2. Apply the full schema

```bash
psql -U landchain -d landchain -f database/schema.sql
```

Verify the tables were created:

```bash
psql -U landchain -d landchain -c "\dt"
```

---

## Running Migrations

Migrations are numbered SQL files in `database/migrations/`. Apply them in order:

```bash
# Apply the initial schema
psql -U landchain -d landchain -f database/migrations/001_initial_schema.sql

# Apply seed data (development only)
psql -U landchain -d landchain -f database/migrations/002_seed_data.sql
```

Each migration file is wrapped in a `BEGIN` / `COMMIT` transaction, so a failure rolls back cleanly.

### Adding a new migration

1. Create `database/migrations/00N_description.sql` (increment the number).
2. Wrap your SQL in `BEGIN; ... COMMIT;`.
3. Use `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE IF EXISTS` to make migrations idempotent.

---

## Seed Data

`002_seed_data.sql` inserts the following test records:

| Email                    | Role    | Password    |
|--------------------------|---------|-------------|
| citizen@landchain.dev    | citizen | password123 |
| officer@landchain.dev    | officer | password123 |
| bank@landchain.dev       | bank    | password123 |
| admin@landchain.dev      | admin   | password123 |

Three sample properties are created, along with ownership history, a mortgage, and tax records.

> **Warning:** Never apply seed data to a production database.

---

## Connecting from the Backend

Set the `DATABASE_URL` environment variable in `backend/.env`:

```env
DATABASE_URL=postgresql://landchain:landchain_secret@localhost:5432/landchain
```

The backend uses the `pg` (node-postgres) library. Connection configuration is in `backend/src/config/database.js`.

---

## Useful Queries

```sql
-- All properties owned by a specific user
SELECT p.property_id, p.survey_number, p.city, p.state, p.status
FROM properties p
WHERE p.owner_id = '11111111-1111-1111-1111-111111111111';

-- Ownership history for a property
SELECT u.full_name, oh.transfer_type, oh.transfer_date
FROM ownership_history oh
JOIN users u ON u.id = oh.owner_id
WHERE oh.property_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY oh.transfer_date;

-- Properties with outstanding tax
SELECT p.property_id, p.city, tr.tax_year, tr.amount
FROM tax_records tr
JOIN properties p ON p.id = tr.property_id
WHERE tr.status IN ('pending', 'overdue');

-- Active mortgages
SELECT p.property_id, u.full_name AS bank_name, m.loan_amount, m.end_date
FROM mortgages m
JOIN properties p ON p.id = m.property_id
JOIN users u ON u.id = m.bank_id
WHERE m.status = 'active';

-- Pending transfer approvals
SELECT t.id, p.property_id, s.full_name AS seller, b.full_name AS buyer, t.status
FROM transactions t
JOIN properties p ON p.id = t.property_id
JOIN users s ON s.id = t.seller_id
JOIN users b ON b.id = t.buyer_id
WHERE t.status NOT IN ('completed', 'cancelled');
```

---

## Schema Diagram

```
users
 ├── properties (owner_id → users.id)
 │    ├── ownership_history (property_id, owner_id)
 │    ├── transactions (property_id, seller_id, buyer_id, officer_id)
 │    ├── documents (property_id, uploaded_by)
 │    ├── mortgages (property_id, bank_id)
 │    ├── tax_records (property_id)
 │    └── approvals (submitted_by, officer_id)
 └── audit_logs (user_id)
```

All monetary columns use `NUMERIC` to avoid floating-point rounding.  
All timestamps include timezone information (`TIMESTAMP WITH TIME ZONE`).  
UUIDs are auto-generated by `uuid-ossp`.
