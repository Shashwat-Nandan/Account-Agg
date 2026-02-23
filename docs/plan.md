# Privacy-Preserving Account Aggregator — Execution Plan

## Project Summary

A privacy-first Account Aggregator (AA) layer for India's financial data sharing framework. Integrates with ReBIT/Setu AA APIs, ONDC financial services, and government eKYC providers — then adds **Aztec/Noir zero-knowledge proofs** so users can prove financial facts (income range, balance threshold, KYC status) without revealing raw data.

**Core Innovation**: Third parties receive cryptographic proofs, never raw bank statements.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Auth/OTP │ │ Consent  │ │ ZK Proof │ │   Share    │ │
│  │  Pages   │ │   UI     │ │Generator │ │  Manager   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│                    │  NoirJS + bb.js WASM (client-side)  │
└────────────────────┼────────────────────────────────────┘
                     │ REST API
┌────────────────────┼────────────────────────────────────┐
│                  NestJS API                              │
│  ┌──────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌───────────┐ │
│  │ Auth │ │Consent │ │FI Data│ │eKYC  │ │  Sharing  │ │
│  │Module│ │ Module │ │Module │ │Module│ │  Module   │ │
│  └──────┘ └────────┘ └───────┘ └──────┘ └───────────┘ │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Proof   │  │    ONDC      │  │    BullMQ        │  │
│  │ Verifier │  │  BAP Module  │  │   Job Queue      │  │
│  └──────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────┼────────────────────────────────────┘
                     │
    ┌────────────────┼─────────────────────┐
    │                │                     │
┌───┴───┐    ┌──────┴──────┐    ┌─────────┴──┐
│Postgres│    │    Redis    │    │   MinIO     │
│  (DB)  │    │  (Queue)   │    │ (FI Blobs)  │
└────────┘    └────────────┘    └─────────────┘
```

---

## Implementation Status — ALL PHASES COMPLETE ✅

### Phase 1 — Foundation ✅
- Monorepo (npm workspaces + Turborepo), Docker Compose (PG, Redis, MinIO)
- `@account-agg/shared` — types, constants (Sahamati templates), utils (JWS, AES-256-GCM)
- NestJS API scaffold with Prisma schema (8 models), JWT+OTP auth, all modules wired

### Phase 2 — AA Integration ✅
- `@account-agg/aa-client` — Setu REST client, JWS interceptor, consent manager, data session handler
- Backend consent module with webhooks, FI data module with MinIO storage & Poseidon hash pipeline
- Frontend consent UI (create form with templates, status list), FI data viewer

### Phase 3 — eKYC Integration ✅
- `@account-agg/ekyc-client` — Aadhaar, DigiLocker, PAN, CKYC adapters + orchestrator
- Backend eKYC module with Poseidon field hashing, attestation computation, raw data deletion
- Frontend KYC wizard with multi-provider step-by-step flow

### Phase 4 — ZK Circuits ✅
- 6 Noir circuits: income-range, balance-threshold, kyc-attestation, transaction-pattern, selective-disclosure, merkle-membership
- All circuits include `#[test]` test cases
- Compile/test scripts, browser ZK integration (NoirJS + bb.js WASM)
- Proof generation UI with circuit selection, progress indicators, proof list

### Phase 5 — ONDC & Sharing ✅
- `@account-agg/ondc-client` — Beckn BAP adapter
- Backend ONDC module with search/init/confirm + callback handlers
- Proof-gated sharing with token-based access, expiry, max access, revocation
- Frontend sharing management UI

### Phase 6 — Tooling ✅
- ESLint 9 flat config, Prettier, lint-staged

---

## Key Files

| Path | Purpose |
|------|---------|
| `packages/shared/` | Types, constants, JWS/encryption utils |
| `packages/aa-client/` | Setu AA REST client, consent manager, data session |
| `packages/ekyc-client/` | Aadhaar, DigiLocker, PAN, CKYC adapters |
| `packages/ondc-client/` | Beckn BAP adapter for ONDC financial services |
| `packages/zk-circuits/` | 6 Noir circuits with compile/test scripts |
| `apps/api/` | NestJS backend (auth, consent, fi-data, ekyc, proof, sharing, ondc) |
| `apps/api/prisma/schema.prisma` | Database schema (8 models) |
| `apps/web/` | Next.js 14 frontend (dashboard, consent, proof, kyc, share pages) |
| `apps/web/src/lib/zk/` | Browser ZK integration (NoirJS + bb.js WASM) |

---

## Key Design Decisions

1. **Client-side proof generation**: Raw financial data never leaves the browser. NoirJS + bb.js WASM runs entirely in the user's browser.

2. **Poseidon commitments as trust bridge**: Server computes Poseidon hashes at data ingestion. ZK circuits verify private inputs match these commitments — users cannot fabricate data.

3. **Detached JWS per ReBIT v2.0.0**: All AA communication uses detached JWS signatures. Incoming webhooks verified against AA public keys.

4. **Raw eKYC deletion**: Only Poseidon hashes retained after verification. No PII stored.

5. **Proof-gated sharing**: Third parties only receive proof metadata + public inputs. Optional raw data sharing requires explicit user consent AND a selective-disclosure proof.

6. **Circuit sizing**: All circuits target 2K-10K gates (well within the 524K WASM limit for browser proving).

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand |
| Backend | NestJS 10, Node.js 20, Prisma 5 |
| ZK Circuits | Noir (Aztec's ZK DSL), Barretenberg (UltraHonk) |
| ZK Browser | @noir-lang/noir_js, @aztec/bb.js (WASM) |
| Database | PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Storage | MinIO (S3-compatible, AES-256-GCM encrypted) |
| Auth | JWT + Phone OTP, Passport.js |
| Crypto | jose (JWS), node:crypto (AES-256-GCM) |
| Monorepo | npm workspaces + Turborepo |
| Containers | Docker Compose |
