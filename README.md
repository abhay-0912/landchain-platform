# LandChain Platform

### Own Land with Proof, Not Paper.

A full-stack blockchain land registry platform that modernizes property registration and ownership tracking with verifiable on-chain records, secure APIs, and scalable web architecture.

![Status](https://img.shields.io/badge/Status-Live-success)
![Frontend](https://img.shields.io/badge/Frontend-Next.js_15-black)
![Backend](https://img.shields.io/badge/Backend-Node.js_Express-green)
![Database](https://img.shields.io/badge/Database-PostgreSQL_(Supabase)-blue)
![Blockchain](https://img.shields.io/badge/Blockchain-Solidity_Hardhat-2f3134)
![Network](https://img.shields.io/badge/Network-Polygon-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 1) Project Title + Tagline

LandChain Platform is an end-to-end property registry system designed for transparent land records, tamper-resistant ownership history, and trust-minimized transactions.

---

## 2) Live Demo

🌐 Production URL: https://landchain-platform.vercel.app/

If the app is sleeping or unavailable, use this placeholder format:

https://your-demo-url-here

---

## 3) Screenshots

Add screenshots to docs/screenshots and update the links below.

![Landing Page](docs/screenshots/landing-page.png)
![Dashboard](docs/screenshots/dashboard.png)
![Property Registration](docs/screenshots/property-registration.png)
![Property Search and Listing](docs/screenshots/property-listing.png)
![Blockchain Ownership View](docs/screenshots/blockchain-ownership.png)

---

## 4) Features

- ✅ Property registration workflow with structured ownership metadata
- ✅ Real-time property listing and search experience
- ✅ Blockchain-anchored ownership records for immutability and auditability
- ✅ Multi-role system: citizen, officer, bank, admin
- ✅ Transfer lifecycle: initiate, confirm, approve, complete, cancel
- ✅ Mortgage lock/release lifecycle tied to ownership restrictions
- ✅ Tax records and dues tracking via REST APIs
- ✅ Document upload and optional IPFS (Pinata) integration
- ✅ Hardened backend with rate limiting, JWT auth, and validation
- ✅ Fully deployed full-stack architecture with zero-cost friendly setup (₹0 on free tiers)

---

## 5) Tech Stack

| Layer | Technologies Used |
|---|---|
| Frontend | Next.js 15, React 18, Tailwind CSS, Axios, React Hook Form |
| Backend | Node.js, Express, JWT, bcryptjs, express-validator, multer |
| Database | PostgreSQL (Supabase-compatible), pg |
| Blockchain | Solidity 0.8.x, Hardhat, OpenZeppelin, Ethers.js |
| Storage | IPFS via Pinata (optional) |
| Deployment | Vercel (frontend), Render (backend), Polygon testnet |

---

## 6) Architecture Diagram

~~~mermaid
flowchart LR
	 U[User] --> F[Frontend<br/>Next.js]
	 F --> B[Backend API<br/>Node.js + Express]
	 B --> D[(PostgreSQL<br/>Supabase)]
	 B --> C[Smart Contracts<br/>Polygon]
	 B --> I[(IPFS / Pinata<br/>Optional)]
~~~

Architecture Flow:

User → Frontend (Next.js) → Backend (Express API) → PostgreSQL → Blockchain (Polygon) → IPFS (optional)

---

## 7) Folder Structure

~~~text
landchain-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── __tests__/
│   └── package.json
├── blockchain/
│   ├── contracts/
│   ├── scripts/
│   ├── test/
│   ├── deployments/
│   └── hardhat.config.js
├── database/
│   ├── migrations/
│   └── schema.sql
├── docs/
├── docker-compose.yml
└── README.md
~~~

---

## 8) Installation & Setup

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (or Supabase project)
- Git

### Step 1: Clone repository

~~~bash
git clone https://github.com/your-username/landchain-platform.git
cd landchain-platform
~~~

### Step 2: Install dependencies

~~~bash
cd backend
npm install

cd ../frontend
npm install

cd ../blockchain
npm install
~~~

### Step 3: Configure environment files

Create:

- backend/.env
- frontend/.env.local

Use the environment variables listed below.

### Step 4: Run database migrations

~~~bash
psql -f database/migrations/001_initial_schema.sql
psql -f database/migrations/002_seed_data.sql
~~~

### Step 5: Deploy contracts locally (optional for local chain)

~~~bash
cd blockchain
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
~~~

### Step 6: Run backend

~~~bash
cd backend
npm run dev
~~~

### Step 7: Run frontend

~~~bash
cd frontend
npm run dev
~~~

Local URLs:

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## 9) Environment Variables

### Backend (backend/.env)

~~~env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3001

BLOCKCHAIN_RPC_URL=https://rpc-amoy.polygon.technology
PRIVATE_KEY=0xyour_private_key
PROPERTY_REGISTRY_ADDRESS=0xyour_property_registry_address
TRANSFER_REGISTRY_ADDRESS=0xyour_transfer_registry_address
MORTGAGE_CONTRACT_ADDRESS=0xyour_mortgage_contract_address

PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET=your_pinata_secret
PINATA_GATEWAY=https://gateway.pinata.cloud

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM=noreply@landchain.io
~~~

### Frontend (frontend/.env.local)

~~~env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
~~~

---

## 10) API Endpoints

Base URL:

http://localhost:3000/api/v1

### Auth

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

---

## 11) Blockchain Details

LandChain uses three Solidity contracts with role-based access control:

### 1. PropertyRegistry.sol

- Registers properties with survey number, geodata, and IPFS hash
- Maintains canonical owner record
- Enforces uniqueness (survey-to-property mapping)
- Supports ownership updates via authorized transfer contract

### 2. TransferRegistry.sol

- Implements regulated transfer workflow:
  - PENDING
  - BUYER_CONFIRMED
  - OFFICER_APPROVED
  - COMPLETED / CANCELLED
- Restricts invalid transfer state transitions
- Updates owner in PropertyRegistry on final completion

### 3. MortgageContract.sol

- Locks properties as collateral for active loans
- Prevents conflicting transfer operations while mortgaged
- Releases mortgage and updates status post-closure

### Network

- Primary testnet target: Polygon Amoy
- Legacy compatibility: Polygon Mumbai configuration is present
- Local development chain: Hardhat localhost (31337)

---

## 12) Deployment Guide (Vercel + Render)

### Frontend on Vercel

1. Import frontend directory into Vercel.
2. Build settings:
	- Framework: Next.js
	- Root Directory: frontend
3. Add environment variable:
	- NEXT_PUBLIC_API_URL = your Render backend URL + /api/v1
4. Deploy.

### Backend on Render

1. Create a new Web Service from backend.
2. Set build/start commands:
	- Build: npm install
	- Start: npm start
3. Add all backend environment variables from Section 9.
4. Attach PostgreSQL (Render DB or Supabase external URL).
5. Ensure CORS_ORIGIN points to Vercel frontend domain.

### Blockchain

1. Deploy contracts from blockchain directory:

~~~bash
npx hardhat run scripts/deploy.js --network amoy
~~~

2. Copy deployed contract addresses into backend environment:

- PROPERTY_REGISTRY_ADDRESS
- TRANSFER_REGISTRY_ADDRESS
- MORTGAGE_CONTRACT_ADDRESS

---

## 13) Future Improvements

- Add wallet-native authentication (SIWE) and signature-based approvals
- Integrate verifiable credentials for stronger KYC proofs
- Add GIS-grade map layers with parcel boundary overlays
- Add event indexer/subgraph for faster on-chain analytics
- Add OCR and AI-based document validation pipeline
- Add multilingual support for wider public adoption
- Add automated legal workflow templates per state policy
- Expand to L2/mainnet with contract upgrade governance

---

## 14) Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit clean, testable changes
4. Open a pull request with clear context and screenshots (if UI changes)

Recommended checklist:

- Add or update tests
- Keep API contracts backward-compatible where possible
- Update documentation for behavior changes

---

## 15) License

This project is licensed under the MIT License.

---

## 16) Author

### Abhay

Software Engineer focused on full-stack systems, applied blockchain architecture, and production-ready developer platforms.

If you are hiring for backend, full-stack, or Web3 engineering roles, this project demonstrates practical delivery across product, architecture, security, deployment, and smart contracts.
