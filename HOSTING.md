# 🚀 Free Hosting Guide — LandChain Platform

This guide walks you through deploying every layer of LandChain **at zero cost** using free tiers from industry-standard cloud providers.

> **Estimated setup time:** 45–90 minutes  
> **Monthly cost:** $0 (within free-tier limits)

---

## Table of Contents

1. [Free-Tier Service Overview](#1-free-tier-service-overview)
2. [Prerequisites](#2-prerequisites)
3. [Step 1 — Deploy the Blockchain to a Public Testnet](#3-step-1--deploy-the-blockchain-to-a-public-testnet)
4. [Step 2 — Set Up Pinata (IPFS Storage)](#4-step-2--set-up-pinata-ipfs-storage)
5. [Step 3 — Provision a Free PostgreSQL Database (Neon)](#5-step-3--provision-a-free-postgresql-database-neon)
6. [Step 4 — Deploy the Backend to Render](#6-step-4--deploy-the-backend-to-render)
7. [Step 5 — Deploy the Frontend to Vercel](#7-step-5--deploy-the-frontend-to-vercel)
8. [Step 6 — (Optional) Free Redis with Upstash](#8-step-6--optional-free-redis-with-upstash)
9. [Step 7 — (Optional) Free Transactional Email](#9-step-7--optional-free-transactional-email)
10. [Environment Variable Reference](#10-environment-variable-reference)
11. [Post-Deployment Checklist](#11-post-deployment-checklist)
12. [Free-Tier Limits & Upgrade Paths](#12-free-tier-limits--upgrade-paths)

---

## 1. Free-Tier Service Overview

| Component       | Recommended Free Service           | Free Allowance                        |
|-----------------|-------------------------------------|---------------------------------------|
| **Frontend**    | [Vercel](https://vercel.com)        | Unlimited deployments, 100 GB-hrs/mo  |
| **Backend**     | [Render](https://render.com)        | 750 free instance hours/mo            |
| **Database**    | [Neon](https://neon.tech)           | 0.5 GB storage, 191 compute hours/mo  |
| **Blockchain**  | Polygon Amoy testnet + [Alchemy](https://alchemy.com) | 300M compute units/mo   |
| **IPFS Storage**| [Pinata](https://pinata.cloud)      | 1 GB storage, 100 GB bandwidth/mo     |
| **Redis**       | [Upstash](https://upstash.com)      | 10,000 commands/day (optional)        |
| **Email**       | [Brevo](https://brevo.com)          | 300 emails/day (optional)             |

---

## 2. Prerequisites

Before you start, make sure you have:

- A **GitHub account** (to connect deployments)
- **Node.js 18+** and **npm** installed locally
- **Git** installed locally
- A forked or cloned copy of this repository pushed to your GitHub account
- A **MetaMask** (or any EVM-compatible) wallet with a funded Amoy testnet address  
  → Get free MATIC from the [Polygon Amoy faucet](https://faucet.polygon.technology/)

---

## 3. Step 1 — Deploy the Blockchain to a Public Testnet

The smart contracts must be deployed to a live testnet before the backend can interact with them.

### 3a. Get a free Alchemy RPC endpoint

1. Sign up at <https://alchemy.com> (free plan, no credit card required).
2. Click **Create App** → choose **Polygon** → choose network **Amoy**.
3. Copy your **HTTPS API URL** — it looks like:  
   `https://polygon-amoy.g.alchemy.com/v2/<YOUR_API_KEY>`

### 3b. Configure the blockchain environment

```bash
cd blockchain
cp .env.example .env   # if the file doesn't already exist
```

Open `blockchain/.env` and fill in:

```env
AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<YOUR_API_KEY>
PRIVATE_KEY=<your_wallet_private_key_WITHOUT_0x_prefix>
POLYGONSCAN_API_KEY=<optional_for_contract_verification>
```

> ⚠️ **Never commit your private key to Git.** Make sure `blockchain/.env` is listed in `.gitignore`.

### 3c. Deploy the contracts

```bash
cd blockchain
npm install
npm run deploy:amoy
```

The script prints three contract addresses. **Copy them** — you will need them for the backend.

```
PropertyRegistry deployed to: 0xABC...
TransferRegistry  deployed to: 0xDEF...
MortgageContract  deployed to: 0x123...
```

---

## 4. Step 2 — Set Up Pinata (IPFS Storage)

1. Sign up at <https://pinata.cloud> (free plan — 1 GB storage).
2. Go to **API Keys** → click **New Key**.
3. Enable the **pinFileToIPFS** and **pinJSONToIPFS** permissions.
4. Click **Create Key** and copy:
   - **API Key** → `PINATA_API_KEY`
   - **API Secret** → `PINATA_SECRET`
5. Your gateway URL is `https://gateway.pinata.cloud` (default).

---

## 5. Step 3 — Provision a Free PostgreSQL Database (Neon)

1. Sign up at <https://neon.tech> (free plan, no credit card required).
2. Click **Create a new project** → choose a region closest to your backend deployment.
3. Neon creates a default database. On the **Dashboard**, click **Connection Details** and copy the **connection string** that looks like:  
   `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`  
   → This is your `DATABASE_URL`.
4. Run the schema migrations against your Neon database:

   ```bash
   # Install psql if needed: https://www.postgresql.org/download/
   psql "<YOUR_NEON_CONNECTION_STRING>" -f database/migrations/001_initial_schema.sql
   ```

   Optionally seed development data:

   ```bash
   psql "<YOUR_NEON_CONNECTION_STRING>" -f database/migrations/002_seed_data.sql
   ```

---

## 6. Step 4 — Deploy the Backend to Render

### 6a. Create a Render account

Sign up at <https://render.com> using your GitHub account (free plan — 750 instance hours/month).

### 6b. Create a new Web Service

1. Click **New** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:

   | Setting            | Value                         |
   |--------------------|-------------------------------|
   | **Name**           | `landchain-backend`           |
   | **Root Directory** | `backend`                     |
   | **Runtime**        | `Node`                        |
   | **Build Command**  | `npm install`                 |
   | **Start Command**  | `npm start`                   |
   | **Instance Type**  | `Free`                        |

### 6c. Set environment variables on Render

In the **Environment** tab, add the following key/value pairs:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<your_neon_connection_string>
JWT_SECRET=<generate_a_long_random_string>
JWT_EXPIRES_IN=7d
PINATA_API_KEY=<from_step_2>
PINATA_SECRET=<from_step_2>
PINATA_GATEWAY=https://gateway.pinata.cloud
BLOCKCHAIN_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/<YOUR_API_KEY>
PRIVATE_KEY=<your_wallet_private_key>
PROPERTY_REGISTRY_ADDRESS=<from_step_1>
TRANSFER_REGISTRY_ADDRESS=<from_step_1>
MORTGAGE_CONTRACT_ADDRESS=<from_step_1>
CORS_ORIGIN=https://<your-vercel-app>.vercel.app
```

> 💡 To generate a secure `JWT_SECRET`, run:  
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 6d. Deploy

Click **Create Web Service**. Render will build and deploy your backend automatically.

After deployment, note your backend URL, e.g.:  
`https://landchain-backend.onrender.com`

> ⚠️ **Free Render instances spin down after 15 minutes of inactivity.** The first request after idle may take ~30 seconds to respond. This is acceptable for demos; upgrade to a paid plan for production.

---

## 7. Step 5 — Deploy the Frontend to Vercel

### 7a. Create a Vercel account

Sign up at <https://vercel.com> using your GitHub account (free Hobby plan).

### 7b. Import your repository

1. Click **Add New…** → **Project**.
2. Select your GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Vercel auto-detects Next.js — no framework override needed.

### 7c. Set environment variables on Vercel

In the **Environment Variables** section before deploying:

```env
NEXT_PUBLIC_API_URL=https://landchain-backend.onrender.com/api/v1
NEXT_PUBLIC_MAPBOX_TOKEN=<your_mapbox_token_or_leave_empty>
```

> 💡 MapBox is only required if you use the map/geo-search feature. You can get a free token at <https://mapbox.com> (free tier: 50,000 map loads/month).

### 7d. Deploy

Click **Deploy**. After a minute or two, Vercel provides your live URL, e.g.:  
`https://landchain-platform.vercel.app`

### 7e. Update CORS on the backend

Go back to Render → your backend service → **Environment** and update:

```env
CORS_ORIGIN=https://landchain-platform.vercel.app
```

Trigger a manual re-deploy on Render so the change takes effect.

---

## 8. Step 6 — (Optional) Free Redis with Upstash

Redis is used for caching and rate-limiting. It is optional for running the platform but improves performance.

1. Sign up at <https://upstash.com> (free tier: 10,000 commands/day, 256 MB).
2. Click **Create Database** → choose **Redis** → select a region.
3. Copy the **Redis URL** in the format:  
   `redis://default:<password>@<host>:<port>`
4. Add to your Render backend environment:

   ```env
   REDIS_URL=redis://default:<password>@<host>:<port>
   ```

---

## 9. Step 7 — (Optional) Free Transactional Email

Email notifications are optional for development/demo environments (the backend logs emails to the console when SMTP is not configured).

### Using Brevo (formerly Sendinblue) — 300 emails/day free

1. Sign up at <https://brevo.com>.
2. Go to **SMTP & API** → **SMTP** tab and copy the credentials.
3. Add to your Render backend environment:

   ```env
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=<your_brevo_login_email>
   SMTP_PASS=<your_brevo_smtp_key>
   EMAIL_FROM=noreply@yourdomain.com
   ```

---

## 10. Environment Variable Reference

### Backend (Render)

| Variable                    | Required | Description                                        |
|-----------------------------|----------|----------------------------------------------------|
| `NODE_ENV`                  | ✅        | Set to `production`                                |
| `PORT`                      | ✅        | `3000`                                             |
| `DATABASE_URL`              | ✅        | PostgreSQL connection string from Neon              |
| `JWT_SECRET`                | ✅        | Long random string for signing JWTs                |
| `JWT_EXPIRES_IN`            | ✅        | Token expiry, e.g. `7d`                            |
| `PINATA_API_KEY`            | ✅        | From Pinata dashboard                              |
| `PINATA_SECRET`             | ✅        | From Pinata dashboard                              |
| `PINATA_GATEWAY`            | ✅        | `https://gateway.pinata.cloud`                     |
| `BLOCKCHAIN_RPC_URL`        | ✅        | Alchemy Polygon Amoy HTTPS URL                     |
| `PRIVATE_KEY`               | ✅        | Wallet private key (no `0x` prefix)                |
| `PROPERTY_REGISTRY_ADDRESS` | ✅        | Deployed contract address                          |
| `TRANSFER_REGISTRY_ADDRESS` | ✅        | Deployed contract address                          |
| `MORTGAGE_CONTRACT_ADDRESS` | ✅        | Deployed contract address                          |
| `CORS_ORIGIN`               | ✅        | Your Vercel frontend URL                           |
| `REDIS_URL`                 | ❌        | Upstash Redis URL (optional)                       |
| `SMTP_HOST`                 | ❌        | SMTP server host (optional)                        |
| `SMTP_PORT`                 | ❌        | SMTP port, typically `587`                         |
| `SMTP_USER`                 | ❌        | SMTP username                                      |
| `SMTP_PASS`                 | ❌        | SMTP password                                      |
| `EMAIL_FROM`                | ❌        | Sender address, e.g. `noreply@landchain.io`        |

### Frontend (Vercel)

| Variable                  | Required | Description                                      |
|---------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_API_URL`     | ✅        | Full URL to backend API, ending in `/api/v1`     |
| `NEXT_PUBLIC_MAPBOX_TOKEN`| ❌        | MapBox public token (only for geo-search feature)|

---

## 11. Post-Deployment Checklist

- [ ] Smart contracts deployed and addresses recorded
- [ ] Neon database created and migrations applied
- [ ] Pinata API credentials obtained
- [ ] Backend deployed to Render with all required environment variables set
- [ ] Frontend deployed to Vercel with `NEXT_PUBLIC_API_URL` pointing to the Render backend
- [ ] `CORS_ORIGIN` on Render updated to the Vercel frontend URL and backend re-deployed
- [ ] Open the Vercel URL in a browser and confirm the homepage loads
- [ ] Register a test user and confirm the API responds correctly
- [ ] (Optional) Upstash Redis connected
- [ ] (Optional) Email notifications configured and tested

---

## 12. Free-Tier Limits & Upgrade Paths

| Service   | Key Free Limits                                         | First Paid Tier                   |
|-----------|---------------------------------------------------------|-----------------------------------|
| Vercel    | 100 GB-hrs bandwidth, 6,000 build minutes/mo            | Pro — $20/mo                      |
| Render    | 750 instance hours/mo, services sleep after 15 min idle | Starter — $7/mo (always-on)       |
| Neon      | 0.5 GB storage, 191 compute hours/mo                    | Launch — $19/mo (10 GB storage)   |
| Alchemy   | 300M compute units/mo (~60M requests)                   | Growth — $49/mo                   |
| Pinata    | 1 GB storage, 100 GB bandwidth/mo                       | Picnic — $20/mo (100 GB storage)  |
| Upstash   | 10,000 Redis commands/day, 256 MB                       | Pay-as-you-go from $0.20/100K cmd |
| Brevo     | 300 emails/day, unlimited contacts                      | Starter — $9/mo                   |

> 💡 For a production launch, the most impactful upgrade is moving the Render backend to a paid always-on instance ($7/mo) so users don't experience cold-start delays.

---

*For architecture details, API reference, and smart-contract documentation, see the [docs/](docs/) directory.*
