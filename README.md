# LandChain Platform

### Blockchain-Based Land Registry System for Transparent, Tamper-Proof Property Ownership

[![Live Demo](https://img.shields.io/badge/Live%20Demo-LandChain-0a7ea4?style=for-the-badge&logo=vercel)](https://landchain-platform.vercel.app/register)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-1f9d55?style=for-the-badge)](#)
[![Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20Solidity-0f172a?style=for-the-badge)](#-tech-stack)
[![License: MIT](https://img.shields.io/badge/License-MIT-2563eb?style=for-the-badge)](LICENSE)

---

## 🔗 Live Demo

Explore the live product here: **https://landchain-platform.vercel.app/register**

What you can do in the demo:
- Create an account and authenticate with role-aware access.
- Register and manage land/property records.
- Search properties using filters.
- Trigger transfer and approval workflows.
- Interact with a blockchain-integrated backend designed for immutable ownership events.

---

## 🖼️ Screenshots

> Replace placeholders with real product screenshots from your deployment.

- Landing / Register Screen: **Add screenshot here**
- Dashboard Overview: **Add screenshot here**
- Property Registration Flow: **Add screenshot here**
- Transfer Approval Workflow: **Add screenshot here**
- API + Blockchain Transaction Evidence: **Add screenshot here**

---

## ✨ Features

- **Tamper-resistant ownership records** backed by smart contracts and auditable transaction history.
- **End-to-end property lifecycle**: registration, ownership history, transfer, mortgage lock/release, and tax records.
- **Role-based workflows** for citizen, officer, bank, and admin personas.
- **On-chain + off-chain architecture** combining PostgreSQL speed with blockchain trust.
- **IPFS-powered document integrity** for title and legal document verification.
- **Transfer state machine** with buyer confirmation and officer approval before completion.
- **Production-oriented API design** with JWT auth, validation, rate limiting, and structured errors.
- **Modular monorepo structure** ready for scaling teams and domain expansion.
- **Free-tier deployability** across Vercel, Render, and Supabase for low-cost operation.

---

## 🧠 Why This Project Matters

Land ownership fraud, title disputes, and opaque registry operations are major real-world issues. LandChain addresses these with a verifiable digital trail:

- **Fraud prevention** through immutable records and signed transaction events.
- **Public trust** via transparent, traceable ownership transitions.
- **Operational efficiency** by digitizing traditionally paper-heavy government workflows.
- **Interoperability** across citizens, regulators, and financial institutions.
- **Future readiness** for e-governance, digital identity, and compliant property financing.

This is not just a CRUD app with Web3 labels. It models a practical government-style registry workflow with clear separation between data, business logic, and trust layer.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS, Axios, React Hook Form |
| Backend | Node.js, Express.js, JWT, Helmet, CORS, Express Validator |
| Database | PostgreSQL (Supabase-compatible), SQL migrations |
| Blockchain | Solidity, Hardhat, OpenZeppelin |
| Networks | Polygon Mumbai (legacy target), Polygon Amoy (current), Local Hardhat |
| Storage | IPFS (Pinata integration) |
| Deployment | Vercel (Frontend), Render (Backend), Supabase (Postgres) |
| Testing | Jest, Supertest, Hardhat tests, React Testing Library |

---

## 🏗️ Architecture

### System Flow

User → Next.js Frontend → Express API → PostgreSQL → Blockchain (Polygon) → IPFS

### Architecture Diagram

```mermaid
flowchart LR
	 A[User] --> B[Next.js Frontend]
	 B --> C[Express Backend API]
	 C --> D[(PostgreSQL / Supabase)]
	 C --> E[Smart Contracts<br/>PropertyRegistry / TransferRegistry / MortgageContract]
	 C --> F[IPFS / Pinata]
	 E --> G[(Polygon Network)]
```

### Design Principle

- **PostgreSQL** handles rich querying, filtering, and operational workflows.
- **Blockchain** anchors critical ownership and transfer state for immutability.
- **IPFS** stores document references and enables hash-based verification.

---

## 📂 Folder Structure

```text
landchain-platform/
├── backend/                # Express API, controllers, models, routes
├── frontend/               # Next.js app (App Router)
├── blockchain/             # Solidity contracts, Hardhat config, deploy scripts
├── database/               # SQL schema and migrations
├── docs/                   # API, architecture, smart contract docs
├── docker-compose.yml      # Local multi-service orchestration
└── README.md
```

---

## ⚙️ Installation & Setup

### 1) Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 15+ (or Supabase project)
- Git

### 2) Clone Repository

```bash
git clone https://github.com/your-username/landchain-platform.git
cd landchain-platform
```

### 3) Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../blockchain && npm install
cd ..
```

### 4) Setup Database

```bash
psql -U postgres -c "CREATE USER landchain WITH PASSWORD 'landchain_secret';"
psql -U postgres -c "CREATE DATABASE landchain OWNER landchain;"
psql -U landchain -d landchain -f database/migrations/001_initial_schema.sql
psql -U landchain -d landchain -f database/migrations/002_seed_data.sql
```

### 5) Configure Environment Variables

Create environment files and add values as shown in the next section.

### 6) Run Local Blockchain and Deploy Contracts

```bash
cd blockchain
npm run node
```

In a second terminal:

```bash
cd blockchain
npm run deploy:local
```

Copy generated contract addresses from blockchain/deployments/addresses.json into backend environment variables.

### 7) Start Backend

```bash
cd backend
npm run dev
```

### 8) Start Frontend

```bash
cd frontend
npm run dev
```

Open http://localhost:3001

---

## 🔐 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_optional
```

### Backend (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/landchain

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3001

PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET=your_pinata_secret
PINATA_GATEWAY=https://gateway.pinata.cloud

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_wallet_private_key

PROPERTY_REGISTRY_ADDRESS=0x...
TRANSFER_REGISTRY_ADDRESS=0x...
MORTGAGE_CONTRACT_ADDRESS=0x...

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
EMAIL_FROM=noreply@landchain.io
```

### Blockchain (.env)

```env
PRIVATE_KEY=your_wallet_private_key

POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
SEPOLIA_RPC_URL=https://rpc.ankr.com/eth_sepolia

POLYGONSCAN_API_KEY=your_polygonscan_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

## 🔌 API Endpoints

Base URL (local): **http://localhost:3000/api/v1**

### Authentication

- POST /auth/register
- POST /auth/login
- GET /auth/me
- PUT /auth/kyc
- PATCH /auth/kyc/:userId/verify

### Properties

- POST /properties
- GET /properties/search
- GET /properties/mine
- GET /properties/:id
- GET /properties/:id/history
- PATCH /properties/:id

### Transfers

- POST /transfers
- GET /transfers/mine
- GET /transfers/:id
- POST /transfers/:id/confirm
- POST /transfers/:id/approve
- POST /transfers/:id/complete
- POST /transfers/:id/cancel

### Mortgages

- POST /mortgages
- GET /mortgages/:id
- GET /mortgages/property/:propertyId
- POST /mortgages/:id/release

### Taxes

- GET /taxes/property/:propertyId/history
- GET /taxes/property/:propertyId/dues
- POST /taxes/property/:propertyId/pay

### Documents

- POST /documents/upload
- GET /documents/property/:propertyId
- GET /documents/:id
- POST /documents/:id/verify

### Admin

- GET /admin/users
- PATCH /admin/users/:userId
- GET /admin/stats
- GET /admin/audit-logs
- GET /admin/properties

### Example Requests

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
	 "email":"abhay@example.com",
	 "password":"StrongPass123",
	 "fullName":"Abhay",
	 "walletAddress":"0x0000000000000000000000000000000000000000"
  }'
```

```bash
curl -X GET http://localhost:3000/api/v1/properties/search?city=Pune \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⛓️ Blockchain Details

LandChain uses three focused smart contracts:

1. **PropertyRegistry.sol**
	- Registers property metadata and tracks canonical ownership.
	- Maintains active/mortgaged status flags.

2. **TransferRegistry.sol**
	- Handles transfer lifecycle: initiated → buyer_confirmed → officer_approved → completed/cancelled.
	- Updates ownership in PropertyRegistry on completion.

3. **MortgageContract.sol**
	- Locks and releases properties for mortgage workflows.
	- Integrates with PropertyRegistry mortgage state.

### Deployment Notes

- Contracts are deployed using blockchain/scripts/deploy.js.
- Deployment outputs addresses to blockchain/deployments/addresses.json.
- PropertyRegistry grants role permissions to TransferRegistry and MortgageContract during deployment.

---

## 🚀 Deployment

### Frontend (Vercel)

1. Import repository into Vercel.
2. Set root directory to frontend.
3. Add environment variable NEXT_PUBLIC_API_URL (Render backend URL + /api/v1).
4. Deploy.

### Backend (Render)

1. Create a new Web Service from backend.
2. Set build/start commands:
	- Build: npm install
	- Start: npm start
3. Add backend environment variables (DATABASE_URL, JWT secrets, blockchain + IPFS keys).
4. Deploy and note public API URL.

### Database (Supabase)

1. Create a Supabase project.
2. Run migrations from database/migrations.
3. Copy pooled DATABASE_URL to backend environment.

### Blockchain (Polygon)

1. Fund deployer wallet with testnet POL.
2. Configure blockchain .env with PRIVATE_KEY + RPC URL.
3. Deploy using:

```bash
cd blockchain
npm run deploy:amoy
# or legacy target
npm run deploy:mumbai
```

4. Set deployed contract addresses in backend environment.

---

## 🧪 Testing

### Run Test Suites

```bash
# Backend API tests
cd backend
npm test

# Frontend component/unit tests
cd ../frontend
npm test

# Smart contract tests
cd ../blockchain
npm test
```

### Manual API Validation

- Use Postman or Insomnia against /api/v1 endpoints.
- Test role-based access control with citizen, officer, bank, and admin users.
- Validate transfer workflow transitions and edge cases (invalid state transitions, unauthorized approvals).

---

## 🔮 Future Improvements

- **Mainnet-grade identity integration** with Aadhaar/eKYC provider adapters (where legally applicable).
- **Event-driven indexing** for blockchain events using a dedicated indexer (The Graph or custom worker).
- **Escrow and payment rails** integration for trustless settlement.
- **Dispute and arbitration module** with case lifecycle and evidence attachments.
- **Digital signature workflow** for agreement and deed execution.
- **GIS map intelligence** with geo-boundary validation and zoning metadata.
- **Observability stack** (structured logging, tracing, dashboards, alerting).
- **Multi-region resilience** and backup strategy for compliance-ready deployments.
- **Open API + SDKs** for government and enterprise integrations.

---

## 🤝 Contributing

Contributions are welcome from engineers, security researchers, and civic-tech builders.

1. Fork the repository.
2. Create a feature branch: git checkout -b feat/your-feature.
3. Commit with meaningful messages.
4. Run all tests before opening a pull request.
5. Open a PR with a clear description, screenshots, and validation notes.

---

## 📜 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 👨‍💻 Author

**Abhay**

Built with a product mindset for real-world digital land governance.
