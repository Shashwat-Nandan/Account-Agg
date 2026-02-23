# 🔐 Account Aggregator — Privacy-Preserving Financial Data with Zero-Knowledge Proofs

India's [Account Aggregator](https://sahamati.org.in/) framework enables consent-based financial data sharing between banks (FIPs) and service providers (FIUs). However, the current model forces users to share **raw** financial data — exposing bank statements, balances, and transactions — even when a third party only needs to verify a simple fact like _"income > ₹5 lakhs"_.

**This project fixes that.** It integrates with ReBIT/Setu AA APIs, ONDC financial services, and government eKYC providers, then layers on **Aztec/Noir zero-knowledge proofs** so users can prove financial facts without revealing any underlying data. Third parties receive cryptographic proofs — never raw bank statements.

---

## ✨ Key Features

- **Consent-Based Data Fetching** — Full consent lifecycle via [Setu AA](https://setu.co/account-aggregator) sandbox (create → approve → fetch → revoke)
- **Client-Side ZK Proof Generation** — Proofs generated entirely in the browser using [NoirJS](https://noir-lang.org/) + Barretenberg WASM; raw data never leaves the client
- **6 Purpose-Built Noir Circuits** — Income range, balance threshold, KYC attestation, transaction patterns, selective disclosure, Merkle membership
- **Multi-Provider eKYC** — Aadhaar, DigiLocker, PAN (NSDL), and CKYC with Poseidon-hashed attestations (raw data deleted after hashing)
- **ONDC / Beckn Integration** — BAP adapter for financial product discovery (loans, insurance, mutual funds) with ZK proofs attached to applications
- **Proof-Gated Sharing** — Third parties verify cryptographic proofs via API; they receive proof metadata and public inputs, never raw financial data
- **End-to-End Encryption** — AES-256-GCM encrypted FI data at rest in MinIO with per-user keys

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser (Next.js)                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Consent UI │  │  FI Data UI  │  │  ZK Proof Engine (WASM)  │  │
│  └─────┬──────┘  └──────┬───────┘  │  NoirJS + Barretenberg   │  │
│        │                │          │  Private inputs stay here │  │
│        │                │          └────────────┬─────────────┘  │
└────────┼────────────────┼──────────────────────┼────────────────┘
         │                │                      │
         ▼                ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                      NestJS API Server                           │
│  auth │ consent │ fi-data │ ekyc │ proof │ sharing │ ondc       │
└───┬────────┬──────────┬────────────────────┬────────────────────┘
    │        │          │                    │
    ▼        ▼          ▼                    ▼
 Postgres  Redis/     MinIO              Setu AA / eKYC /
  (Prisma) BullMQ   (encrypted          ONDC APIs
                      FI blobs)
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand |
| **Backend** | NestJS 10, Node.js 20 LTS, Prisma 5 |
| **ZK Circuits** | Noir (Aztec's ZK DSL), Barretenberg (UltraHonk) |
| **ZK Browser Runtime** | `@noir-lang/noir_js`, `@aztec/bb.js` (WASM) |
| **Database** | PostgreSQL 16 |
| **Queue** | BullMQ + Redis 7 |
| **Object Storage** | MinIO (S3-compatible) — encrypted FI data blobs |
| **Auth** | JWT + Phone OTP, Passport.js |
| **Crypto** | `jose` (JWS), `node:crypto` (AES-256-GCM), Poseidon hashing |
| **Monorepo** | npm workspaces + Turborepo |
| **Containers** | Docker + docker-compose |

---

## 📁 Project Structure

```
Account-Agg/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   └── src/
│   │       ├── app/                # App Router pages
│   │       │   ├── (auth)/         # Login, register
│   │       │   └── (dashboard)/    # Accounts, consents, data, proofs, KYC, share
│   │       └── lib/zk/             # NoirJS client, circuit loader, proof store
│   │
│   └── api/                        # NestJS backend
│       └── src/
│           ├── modules/
│           │   ├── auth/           # JWT + OTP authentication
│           │   ├── consent/        # Consent lifecycle + Setu webhooks
│           │   ├── fi-data/        # FI fetch, decrypt, parse, store
│           │   ├── ekyc/           # Multi-provider KYC orchestration
│           │   ├── proof/          # Server-side proof verification
│           │   ├── sharing/        # Proof-gated third-party sharing
│           │   └── ondc/           # ONDC/Beckn BAP integration
│           ├── common/             # Guards, interceptors, decorators
│           └── database/           # Prisma service + schema
│
├── packages/
│   ├── shared/                     # Types, constants, utils (JWS, encryption)
│   ├── zk-circuits/                # 6 Noir ZK circuits (see below)
│   ├── aa-client/                  # Setu AA REST client + JWS interceptor
│   ├── ekyc-client/                # Aadhaar, DigiLocker, PAN, CKYC adapters
│   └── ondc-client/                # Beckn protocol BAP adapter
│
├── docker-compose.yml              # PostgreSQL, Redis, MinIO
├── turbo.json                      # Turborepo pipeline config
└── .env.example                    # Environment variable template
```

---

## 🔒 ZK Circuits

Six Noir circuits, all within browser WASM limits (~2K–10K gates each):

| Circuit | Proves | Private Inputs | Public Inputs |
|---|---|---|---|
| **income-range** | Annual income falls within [min, max] | 12 monthly credit amounts, data hash | min\_income, max\_income, expected\_hash |
| **balance-threshold** | Balance ≥ threshold | balance, account hash | threshold, expected\_hash |
| **kyc-attestation** | KYC completed at required level | field hashes, provider, timestamp | attestation\_hash, min\_provider\_level |
| **transaction-pattern** | Bounced transactions below limit | 100 tx statuses/amounts, count | expected\_hash, max\_bounced |
| **selective-disclosure** | Selected fields match record | 5 account fields | disclosure\_mask, disclosed\_values, record\_hash |
| **merkle-membership** | User exists in verified set | leaf, index, 20-node path | root |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.0.0
- **Docker** & **Docker Compose**
- **Nargo** (Noir compiler) — [install guide](https://noir-lang.org/docs/getting_started/installation)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Shashwat-Nandan/Account-Agg.git
cd Account-Agg

# 2. Install dependencies
npm install

# 3. Start infrastructure (PostgreSQL, Redis, MinIO)
docker compose up -d

# 4. Configure environment
cp .env.example .env
# Edit .env with your Setu sandbox credentials, keys, etc.

# 5. Run database migrations
npm run db:migrate

# 6. Compile ZK circuits
cd packages/zk-circuits && ./scripts/compile-all.sh && cd ../..

# 7. Start development servers
npm run dev
```

The web app will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

---

## 🔄 Core Data Flows

### Consent → FI Data → ZK Proof → Share

1. User creates consent → Backend calls Setu → User approves on AA portal
2. Setu webhook notifies `ACTIVE` → Backend creates data session → Fetches encrypted FI data
3. Backend decrypts FI, parses by type, re-encrypts to MinIO, computes Poseidon data hash
4. User opens proof page → Browser loads ACIR circuit + FI data + data hash
5. **Browser generates ZK proof locally** (NoirJS + bb.js WASM) — raw data stays in browser
6. Proof sent to server → Server verifies with bb.js → Stores verified proof
7. User creates share (proof + recipient + expiry) → Third party fetches via token
8. Server re-verifies proof, returns proof metadata + public inputs (**never raw data**)

### eKYC → Attestation → ZK KYC Proof

1. User completes Aadhaar/DigiLocker/PAN eKYC → Server receives verified identity data
2. Server hashes each field with Poseidon, computes attestation hash, **deletes raw data**
3. User loads `kyc-attestation` circuit in browser with field hashes as private inputs
4. Browser generates proof that KYC was completed at required level
5. Third party verifies: _"this user completed Aadhaar-level KYC"_ — without seeing any documents

---

## 🛡️ Security

- **Data never leaves the browser** — Private witness inputs (balances, income, KYC fields) stay client-side during proof generation
- **Poseidon commitments as trust bridge** — Server computes hashes at data ingestion; ZK circuits verify private inputs match these commitments
- **JWS on all AA communication** — Detached JWS signatures per ReBIT v2.0.0 spec; incoming webhooks verified against AA public key
- **Encrypted at rest** — AES-256-GCM with per-user keys via Vault/KMS
- **Raw eKYC deleted** — Only Poseidon hashes retained post-verification
- **Proof-gated sharing** — Third parties receive cryptographic proofs, never raw financial data
- **Full audit trail** — Every data access event logged with user, timestamp, action, resource

---

## 🧪 Testing

```bash
# Run all tests
npm test

# ZK circuit tests
cd packages/zk-circuits && ./scripts/test-all.sh

# Lint & format
npm run lint
npm run format:check
```

| Layer | Framework | Focus |
|---|---|---|
| ZK Circuits | `nargo test` | Happy path, boundary conditions, hash integrity |
| Unit | Jest / Vitest | Services, parsers, JWS utils, encryption |
| Integration | Jest + Supertest | Consent flow vs Setu sandbox, webhook verification |
| E2E | Playwright | Full user flows including browser proof generation |
| Performance | k6 | API load testing, proof generation benchmarks |

---

## 📄 License

This project is private and proprietary.
