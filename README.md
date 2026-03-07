# 🏛️ LandChain Platform

> Blockchain-based land registry platform for secure property ownership, title verification, and transparent land transactions.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-purple)](https://soliditylang.org)

---

## Features

- 🔐 **KYC-gated access** — citizens, officers, banks, and admins with role-based permissions
- 📜 **Immutable property registry** — every registration and ownership change anchored on-chain
- 🔄 **4-step transfer workflow** — seller → buyer confirmation → officer approval → completion
- 🏦 **Mortgage management** — banks lock/release collateral with on-chain enforcement
- 📁 **IPFS document storage** — title deeds and legal docs pinned via Pinata
- 🗂️ **Full audit trail** — every action logged to PostgreSQL audit_logs
- 🗺️ **Geo-search** — find properties by city, state, or coordinates

---

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | Next.js 14, React, Tailwind CSS, ethers.js v6 |
| Backend    | Node.js 18, Express 4, JWT, express-validator |
| Database   | PostgreSQL 15                                 |
| Blockchain | Solidity 0.8.19, Hardhat, OpenZeppelin v5     |
| Storage    | IPFS via Pinata                               |
| Cache      | Redis 7 (optional)                            |

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-org/landchain-platform.git
cd landchain-platform
```

### 2. Set up environment variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit each file with your values
```

### 3. Set up the database

```bash
psql -U postgres -c "CREATE USER landchain WITH PASSWORD 'landchain_secret';"
psql -U postgres -c "CREATE DATABASE landchain OWNER landchain;"
psql -U landchain -d landchain -f database/migrations/001_initial_schema.sql
psql -U landchain -d landchain -f database/migrations/002_seed_data.sql  # dev only
```

### 4. Start the blockchain node

```bash
cd blockchain
npm install
npx hardhat node        # runs on localhost:8545
# In a second terminal:
npx hardhat run scripts/deploy.js --network localhost
# Copy the deployed addresses into backend/.env
```

### 5. Start the backend

```bash
cd backend
npm install
npm run dev             # runs on localhost:3000
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm run dev             # runs on localhost:3001
```

Open [http://localhost:3001](http://localhost:3001).

---

## Docker (recommended for local dev)

```bash
cp .env.example .env   # fill in values
docker compose up -d
```

Services: PostgreSQL on `:5432`, Redis on `:6379`, backend on `:3000`, frontend on `:3001`.

---

## Running Tests

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Smart contracts
cd blockchain && npx hardhat test
```

---

## Deployment

- **Free hosting (zero cost):** See [HOSTING.md](HOSTING.md) for a step-by-step guide to deploying every layer for free using Vercel, Render, Neon, Alchemy, and Pinata.
- **Production architecture:** See [docs/architecture.md](docs/architecture.md#deployment-architecture) for the full production deployment guide.

---

## Documentation

| Document | Description |
|----------|-------------|
| [HOSTING.md](HOSTING.md) | Step-by-step guide to hosting for free (Vercel, Render, Neon, Alchemy, Pinata) |
| [docs/architecture.md](docs/architecture.md) | System architecture, data flows, security model |
| [docs/api.md](docs/api.md) | Full REST API reference |
| [docs/smart-contracts.md](docs/smart-contracts.md) | Smart contract functions, events, roles |
| [database/README.md](database/README.md) | Database setup and migration guide |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and ensure all tests pass before submitting.

---

## License

[MIT](LICENSE)
