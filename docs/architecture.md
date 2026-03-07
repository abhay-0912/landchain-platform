# LandChain Architecture

## Table of Contents

- [System Overview](#system-overview)
- [Layer Descriptions](#layer-descriptions)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Data Flow](#data-flow)
  - [Property Registration](#property-registration)
  - [Ownership Transfer](#ownership-transfer)
  - [Mortgage Lifecycle](#mortgage-lifecycle)
- [Security Model](#security-model)
- [Deployment Architecture](#deployment-architecture)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LANDCHAIN PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                     PRESENTATION LAYER                               │  │
│   │                                                                      │  │
│   │   ┌─────────────────────────────────────────────────────────────┐   │  │
│   │   │           Next.js 14 Frontend  (port 3001)                  │   │  │
│   │   │   React · Tailwind CSS · ethers.js · Mapbox GL              │   │  │
│   │   └───────────────────────────┬─────────────────────────────────┘   │  │
│   └───────────────────────────────┼──────────────────────────────────────┘  │
│                                   │ HTTPS / REST                             │
│   ┌───────────────────────────────▼──────────────────────────────────────┐  │
│   │                      API / BUSINESS LAYER                            │  │
│   │                                                                      │  │
│   │   ┌─────────────────────────────────────────────────────────────┐   │  │
│   │   │           Express.js Backend  (port 3000)                   │   │  │
│   │   │   JWT Auth · Role-based Access · Input Validation           │   │  │
│   │   │   Helmet · Rate Limiting · Audit Logging                    │   │  │
│   │   └──────────┬──────────────────────┬───────────────────────────┘   │  │
│   └──────────────┼──────────────────────┼────────────────────────────────┘  │
│                  │ SQL (pg)             │ JSON-RPC (ethers.js)               │
│   ┌──────────────▼────────┐   ┌────────▼──────────────────────────────┐    │
│   │   DATA LAYER          │   │   BLOCKCHAIN LAYER                    │    │
│   │                       │   │                                       │    │
│   │  ┌─────────────────┐  │   │  ┌──────────────────────────────┐    │    │
│   │  │  PostgreSQL 15  │  │   │  │  EVM-Compatible Network      │    │    │
│   │  │  (port 5432)    │  │   │  │  (Hardhat local / Polygon)   │    │    │
│   │  └─────────────────┘  │   │  │                              │    │    │
│   │                       │   │  │  ┌────────────────────────┐  │    │    │
│   │  ┌─────────────────┐  │   │  │  │  PropertyRegistry.sol  │  │    │    │
│   │  │  Redis 7        │  │   │  │  │  TransferRegistry.sol  │  │    │    │
│   │  │  (cache/queue)  │  │   │  │  │  MortgageContract.sol  │  │    │    │
│   │  └─────────────────┘  │   │  │  └────────────────────────┘  │    │    │
│   └───────────────────────┘   └──────────────┬────────────────────┘    │    │
│                                              │ IPFS CIDs                    │
│                               ┌─────────────▼──────────────────────────┐   │
│                               │   STORAGE LAYER                        │   │
│                               │   Pinata / IPFS (title docs, deeds)    │   │
│                               └────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Descriptions

### Frontend (Next.js 14)

| Attribute | Detail |
|-----------|--------|
| Framework | Next.js 14 (App Router) |
| Language  | JavaScript / JSX |
| Styling   | Tailwind CSS |
| Web3      | ethers.js v6 |
| Maps      | Mapbox GL JS |
| Auth      | JWT stored in HTTP-only cookie via backend |

The frontend communicates exclusively with the Express backend via REST. It never connects directly to the blockchain node or database.

### Backend (Express.js)

| Attribute | Detail |
|-----------|--------|
| Runtime   | Node.js 18+ |
| Framework | Express 4 |
| Auth      | JWT (jsonwebtoken), bcryptjs for password hashing |
| Validation| express-validator |
| Security  | helmet, express-rate-limit |
| Database  | node-postgres (pg) |
| Blockchain| ethers.js v6 |
| Files     | multer (upload) → Pinata (IPFS pinning) |

### Blockchain Layer

Three Solidity contracts deployed on an EVM-compatible network (Hardhat for local dev; Polygon Mumbai for staging):

| Contract | Responsibility |
|----------|----------------|
| `PropertyRegistry` | Register properties; track ownership and mortgage state |
| `TransferRegistry` | 4-step ownership transfer workflow |
| `MortgageContract` | Lock/release properties as loan collateral |

All contracts use OpenZeppelin `AccessControl` for role-based permissions.

### Storage Layer (IPFS / Pinata)

Documents (title deeds, mortgage deeds, tax receipts) are uploaded to IPFS via Pinata. The resulting IPFS CID (content identifier) is stored in both the PostgreSQL database and on-chain, providing an immutable link between the legal document and the blockchain record.

---

## User Roles and Permissions

| Permission                         | Citizen | Officer | Bank | Admin |
|------------------------------------|:-------:|:-------:|:----:|:-----:|
| Register / view own properties     | ✅      | ✅      | ✅   | ✅    |
| Initiate property transfer         | ✅      | —       | —    | ✅    |
| Confirm transfer as buyer          | ✅      | —       | —    | ✅    |
| Approve transfer (officer step)    | —       | ✅      | —    | ✅    |
| Complete / cancel transfer         | ✅      | —       | —    | ✅    |
| Lock mortgage on property          | —       | —       | ✅   | ✅    |
| Release mortgage                   | —       | —       | ✅   | ✅    |
| Upload documents                   | ✅      | ✅      | ✅   | ✅    |
| Pay tax records                    | ✅      | —       | —    | ✅    |
| Create / update tax records        | —       | ✅      | —    | ✅    |
| Manage approvals                   | —       | ✅      | —    | ✅    |
| View audit logs                    | —       | —       | —    | ✅    |
| Manage users (KYC, activate)       | —       | —       | —    | ✅    |

---

## Data Flow

### Property Registration

```
Citizen                  Backend                  PostgreSQL          Blockchain
   │                        │                         │                   │
   │── POST /properties ───►│                         │                   │
   │   (metadata + doc)     │                         │                   │
   │                        │── upload doc to IPFS ──►│                   │
   │                        │◄── ipfsHash ────────────│                   │
   │                        │                         │                   │
   │                        │── INSERT properties ───►│                   │
   │                        │◄── propertyId ──────────│                   │
   │                        │                         │                   │
   │                        │── registerProperty() ──────────────────────►│
   │                        │◄── blockchainPropertyId ────────────────────│
   │                        │                         │                   │
   │                        │── UPDATE properties ───►│                   │
   │                        │   (blockchain_id, tx)   │                   │
   │                        │                         │                   │
   │◄── 201 Created ────────│                         │                   │
```

### Ownership Transfer

```
Seller      Buyer       Officer      Backend       PostgreSQL     Blockchain
  │           │            │            │               │              │
  │─ POST /transfers ─────►│            │               │              │
  │  initiateTransfer      │            │               │              │
  │                        │            │─ INSERT tx ──►│              │
  │                        │            │◄──────────────│              │
  │                        │            │─ initiateTransfer() ────────►│
  │◄─── 201 Created ───────────────────►│               │              │
  │                        │            │               │              │
  │           │─ POST /transfers/:id/confirm ──────────►│              │
  │           │  (buyer confirms)        │               │              │
  │           │                         │─ UPDATE tx ──►│              │
  │           │                         │─ confirmByBuyer() ──────────►│
  │           │◄─── 200 OK ─────────────│               │              │
  │           │                         │               │              │
  │           │            │─ POST /transfers/:id/approve ────────────►│
  │           │            │            │─ UPDATE tx ──►│              │
  │           │            │            │─ approveByOfficer() ────────►│
  │           │            │◄── 200 OK ─│               │              │
  │           │            │            │               │              │
  │─ POST /transfers/:id/complete ──────►│               │              │
  │                        │            │─ UPDATE tx ──►│              │
  │                        │            │─ completeTransfer() ────────►│
  │                        │            │  (updateOwner in registry)   │
  │                        │            │─ INSERT ownership_history ──►│
  │◄─── 200 OK ────────────────────────►│               │              │
```

### Mortgage Lifecycle

```
Bank                    Backend               PostgreSQL          Blockchain
  │                        │                      │                   │
  │── POST /mortgages ────►│                      │                   │
  │   (propertyId, amount) │                      │                   │
  │                        │── upload deed ──────►│                   │
  │                        │── INSERT mortgages ─►│                   │
  │                        │── lockProperty() ────────────────────────►│
  │                        │   (sets isMortgaged=true in registry)     │
  │                        │── UPDATE properties ►│                   │
  │                        │   (status='mortgaged')│                  │
  │◄── 201 Created ────────│                      │                   │
  │                        │                      │                   │
  │  [... loan repaid ...]  │                      │                   │
  │                        │                      │                   │
  │── POST /mortgages/:id/release ────────────────►│                  │
  │                        │── UPDATE mortgages ─►│                   │
  │                        │── releaseProperty() ─────────────────────►│
  │                        │── UPDATE properties ►│                   │
  │◄── 200 OK ─────────────│                      │                   │
```

---

## Security Model

### Authentication & Authorisation

- All API endpoints (except `POST /auth/register` and `POST /auth/login`) require a valid JWT Bearer token.
- JWTs are signed with `HS256` and expire after 7 days by default (configurable via `JWT_EXPIRES_IN`).
- Role is embedded in the JWT payload and verified server-side on every request.
- `roleCheck` middleware enforces role-based access at the route level.

### Transport Security

- HTTPS required in production (terminate at load balancer or reverse proxy).
- `helmet` sets security headers (CSP, HSTS, X-Frame-Options, etc.).
- CORS is restricted to `CORS_ORIGIN` (defaults to the frontend origin).
- Rate limiting: 100 requests per 15-minute window per IP (configurable).

### Input Validation

- All incoming data is validated with `express-validator` before reaching controllers.
- SQL queries use parameterised statements via `node-postgres` to prevent injection.
- File uploads are size-limited and MIME-type validated before IPFS upload.

### Blockchain Security

- Smart contracts use OpenZeppelin `AccessControl`; no single owner key has unrestricted power.
- The backend wallet holds only `REGISTRAR_ROLE`, `TRANSFER_ROLE`, or `BANK_ROLE` as needed.
- On-chain property state (ownership, mortgage flag) is the authoritative source of truth.
- IPFS CIDs stored on-chain create an immutable link to legal documents.

### KYC

- Sensitive document hashes (Aadhaar, PAN, address proof) are stored as one-way hashes only.
- Raw identity documents are never persisted in the database.
- Users must reach `kyc_status = 'verified'` before initiating or receiving a property transfer.

### Audit Logging

- Every create/update/delete operation writes an entry to `audit_logs` (user, action, resource, IP, metadata).
- Logs are append-only; no application code updates or deletes audit entries.

---

## Deployment Architecture

### Local Development

```
localhost:3001  ──►  localhost:3000  ──►  localhost:5432 (PostgreSQL)
   (Next.js)          (Express)           localhost:8545 (Hardhat node)
                                          Pinata API (external)
```

### Production (recommended)

```
                         ┌────────────────────────────────┐
Internet  ──►  CDN/WAF ──►  Load Balancer (HTTPS 443)      │
                         │                                │
                         │  ┌────────────────────────┐   │
                         │  │  Frontend (Vercel/CDN)  │   │
                         │  └───────────┬─────────────┘   │
                         │              │ API calls        │
                         │  ┌───────────▼─────────────┐   │
                         │  │  Backend (2+ replicas)  │   │
                         │  │  Node.js + PM2          │   │
                         │  └────┬──────────┬──────────┘   │
                         │       │          │              │
                         │  ┌────▼──┐  ┌────▼──────────┐  │
                         │  │  RDS  │  │  Polygon RPC  │  │
                         │  │  PG15 │  │  (Alchemy/    │  │
                         │  └───────┘  │   Infura)     │  │
                         │             └───────────────┘  │
                         └────────────────────────────────┘
```

| Component   | Recommended Service              |
|-------------|----------------------------------|
| Frontend    | Vercel / AWS CloudFront + S3     |
| Backend     | AWS ECS / Railway / Render       |
| Database    | AWS RDS PostgreSQL 15            |
| Blockchain  | Polygon Mainnet via Alchemy      |
| IPFS        | Pinata (dedicated gateway)       |
| Redis       | AWS ElastiCache / Upstash        |
| Secrets     | AWS Secrets Manager / Doppler    |
