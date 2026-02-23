Plan to implement                                                                               │
│                                                                                                 │
│ Privacy-Preserving Account Aggregator with Zero-Knowledge Proofs                                │
│                                                                                                 │
│ Context                                                                                         │
│                                                                                                 │
│ India's Account Aggregator (AA) framework enables consent-based financial data sharing between  │
│ banks (FIPs) and service providers (FIUs). However, the current model requires sharing raw      │
│ financial data with third parties — exposing sensitive bank statements, balances, and           │
│ transactions even when the third party only needs to verify a simple fact (e.g., "income > 5    │
│ lakhs").                                                                                        │
│                                                                                                 │
│ This project builds an AA layer that integrates with ReBIT/Setu AA APIs, ONDC financial         │
│ services, and government eKYC providers — then adds Aztec/Noir zero-knowledge proofs so users   │
│ can prove financial facts without revealing underlying data. Third parties receive              │
│ cryptographic proofs, never raw bank statements.                                                │
│                                                                                                 │
│ ---                                                                                             │
│ Tech Stack                                                                                      │
│                                                                                                 │
│ ┌────────────────┬───────────────────────────────────────────────────────────┐                  │
│ │     Layer      │                        Technology                         │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Frontend       │ Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Backend        │ NestJS 10, Node.js 20 LTS, Prisma 5                       │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ ZK Circuits    │ Noir (Aztec's ZK DSL), Barretenberg (UltraHonk)           │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ ZK Browser     │ @noir-lang/noir_js, @aztec/bb.js (WASM)                   │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Database       │ PostgreSQL 16                                             │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Queue          │ BullMQ + Redis 7                                          │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Object Storage │ MinIO (S3-compatible) — encrypted FI data blobs           │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Auth           │ JWT + Phone OTP, Passport.js                              │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Crypto         │ jose (JWS), node:crypto (AES-256-GCM)                     │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Monorepo       │ npm workspaces + Turborepo                                │                  │
│ ├────────────────┼───────────────────────────────────────────────────────────┤                  │
│ │ Containers     │ Docker + docker-compose                                   │                  │
│ └────────────────┴───────────────────────────────────────────────────────────┘                  │
│                                                                                                 │
│ ---                                                                                             │
│ Project Structure                                                                               │
│                                                                                                 │
│ Account-Agg/                                                                                    │
│ ├── package.json                    # npm workspaces root                                       │
│ ├── turbo.json                      # Turborepo pipeline                                        │
│ ├── docker-compose.yml              # PostgreSQL, Redis, MinIO                                  │
│ ├── .env.example                                                                                │
│ │                                                                                               │
│ ├── packages/                                                                                   │
│ │   ├── shared/                     # Types, utils, constants                                   │
│ │   │   └── src/                                                                                │
│ │   │       ├── types/              # consent.ts, fi-data.ts, ekyc.ts, zk-proof.ts, ondc.ts     │
│ │   │       ├── constants/          # fi-types.ts, consent-templates.ts                         │
│ │   │       └── utils/              # jws.ts, encryption.ts                                     │
│ │   │                                                                                           │
│ │   ├── zk-circuits/                # Noir circuits                                             │
│ │   │   ├── income-range/           # Prove income in [min, max]                                │
│ │   │   ├── balance-threshold/      # Prove balance >= threshold                                │
│ │   │   ├── kyc-attestation/        # Prove KYC done without revealing docs                     │
│ │   │   ├── transaction-pattern/    # Prove no bounced checks etc.                              │
│ │   │   ├── selective-disclosure/   # Reveal only selected fields                               │
│ │   │   ├── merkle-membership/      # Prove user in verified set                                │
│ │   │   ├── compiled/               # Build output (ACIR JSON)                                  │
│ │   │   └── scripts/                # compile-all.sh, test-all.sh                               │
│ │   │                                                                                           │
│ │   ├── aa-client/                  # Setu AA REST client + JWS interceptor                     │
│ │   ├── ekyc-client/                # Aadhaar, DigiLocker, PAN, CKYC adapters                   │
│ │   └── ondc-client/                # Beckn protocol BAP adapter                                │
│ │                                                                                               │
│ ├── apps/                                                                                       │
│ │   ├── web/                        # Next.js frontend                                          │
│ │   │   └── src/                                                                                │
│ │   │       ├── app/                # App Router pages                                          │
│ │   │       │   ├── (auth)/         # login, register                                           │
│ │   │       │   ├── (dashboard)/    # accounts, consents, data, proofs, kyc, share              │
│ │   │       │   └── api/            # BFF routes                                                │
│ │   │       ├── components/         # consent/, proof/, kyc/, shared/                           │
│ │   │       └── lib/zk/             # noir-client.ts, circuit-loader.ts, proof-store.ts         │
│ │   │                                                                                           │
│ │   └── api/                        # NestJS backend                                            │
│ │       └── src/                                                                                │
│ │           ├── modules/                                                                        │
│ │           │   ├── auth/           # JWT + OTP auth                                            │
│ │           │   ├── consent/        # Consent lifecycle + Setu webhooks                         │
│ │           │   ├── fi-data/        # FI fetch, decrypt, parse, store                           │
│ │           │   ├── ekyc/           # Multi-provider KYC orchestration                          │
│ │           │   ├── proof/          # Server-side proof verification                            │
│ │           │   ├── sharing/        # Proof-gated third-party sharing                           │
│ │           │   └── ondc/           # ONDC/Beckn BAP integration                                │
│ │           ├── common/             # JWS interceptor, rate limiting, logging                   │
│ │           └── database/prisma/    # schema.prisma + migrations                                │
│ │                                                                                               │
│ └── docs/                           # architecture, api-spec, zk-circuits docs                  │
│                                                                                                 │
│ ---                                                                                             │
│ Implementation Phases                                                                           │
│                                                                                                 │
│ Phase 1: Foundation (Weeks 1-3)                                                                 │
│                                                                                                 │
│ Goal: Monorepo scaffold, database, auth, basic UI shell.                                        │
│                                                                                                 │
│ 1. Initialize npm workspaces + Turborepo, scaffold NestJS and Next.js apps                      │
│ 2. Set up docker-compose (PostgreSQL, Redis, MinIO)                                             │
│ 3. Create Prisma schema with these core models:                                                 │
│   - User — phone, email, kycStatus                                                              │
│   - Consent — setuConsentId, vua, status, fiTypes[], purpose, dataRange, approvalUrl            │
│   - DataSession — consentId, status, fiDataRef (encrypted blob key)                             │
│   - KycRecord — provider (AADHAAR/DIGILOCKER/PAN/CKYC), attestationHash                         │
│   - Proof — circuitType, publicInputs, proofData, verified                                      │
│   - ProofShare — recipientId, purpose, expiresAt, revokedAt                                     │
│ 4. Implement JWT auth with phone OTP login                                                      │
│ 5. Build dashboard shell with navigation (accounts, consents, data, proofs, kyc, share)         │
│ 6. Set up ESLint, Prettier, Husky, packages/shared with TypeScript types                        │
│                                                                                                 │
│ Phase 2: Account Aggregator Integration (Weeks 4-6)                                             │
│                                                                                                 │
│ Goal: Full consent lifecycle and FI data retrieval via Setu sandbox.                            │
│                                                                                                 │
│ 1. Build packages/aa-client:                                                                    │
│   - Setu REST client with bearer token + x-product-instance-id headers                          │
│   - Axios interceptor for auto-attaching x-jws-signature (detached JWS via jose)                │
│   - Consent manager: create, poll status, revoke                                                │
│   - Data session: create session, fetch encrypted FI, decrypt                                   │
│ 2. Backend consent module:                                                                      │
│   - POST /api/consents — create via Setu, return approval URL                                   │
│   - POST /api/webhooks/consent-notification — receive status changes, verify JWS                │
│   - POST /api/webhooks/fi-notification — FI data ready trigger                                  │
│   - BullMQ job for async data session polling + FI fetch                                        │
│ 3. FI data processing pipeline:                                                                 │
│   - Decrypt FI payload from Setu                                                                │
│   - Parse by FI type (DEPOSIT, MUTUAL_FUNDS, EQUITIES, etc.)                                    │
│   - Re-encrypt with AES-256-GCM, store blob in MinIO                                            │
│   - Compute Poseidon hash of FI data — this becomes the data commitment for ZK proofs           │
│ 4. Frontend consent UI:                                                                         │
│   - Consent creation form (VUA input, FI type multi-select, date range, Fair Use template       │
│ picker)                                                                                         │
│   - Consent list with status badges                                                             │
│   - FI data viewer (parsed bank statements, account summaries, transaction list)                │
│                                                                                                 │
│ Phase 3: eKYC Integration (Weeks 7-9)                                                           │
│                                                                                                 │
│ Goal: Multi-provider KYC with attestation hashing for ZK circuits.                              │
│                                                                                                 │
│ 1. Build packages/ekyc-client with adapters for:                                                │
│   - Aadhaar eKYC: OTP request/verify, parse response (name, DOB, gender, address)               │
│   - DigiLocker: OAuth 2.0 flow, document pull (Aadhaar XML, PAN, DL)                            │
│   - PAN Verification: NSDL API, name-PAN match                                                  │
│   - CKYC Registry: Search by PAN/Aadhaar, download record                                       │
│   - Unified orchestrator that tries providers in priority order                                 │
│ 2. Backend eKYC module with endpoints for each provider                                         │
│ 3. Critical ZK bridge: After successful KYC verification:                                       │
│   - Hash each field with Poseidon: name_hash, dob_hash, pan_hash                                │
│   - Compute attestation: Poseidon(name_hash, dob_hash, pan_hash, provider, timestamp)           │
│   - Store attestationHash in KycRecord                                                          │
│   - Delete raw eKYC data — retain only hashes                                                   │
│ 4. Frontend KYC wizard: step-by-step flow across providers, status dashboard                    │
│                                                                                                 │
│ Phase 4: ZK Circuit Development (Weeks 10-13)                                                   │
│                                                                                                 │
│ Goal: Build, test, and compile all Noir circuits. Integrate NoirJS into browser.                │
│                                                                                                 │
│ 6 Noir Circuits:                                                                                │
│                                                                                                 │
│ Circuit: income-range                                                                           │
│ Private Inputs: 12 monthly credit amounts, data_hash                                            │
│ Public Inputs: min_income, max_income, expected_hash                                            │
│ Proves: Income falls within range                                                               │
│ ────────────────────────────────────────                                                        │
│ Circuit: balance-threshold                                                                      │
│ Private Inputs: balance, account_hash                                                           │
│ Public Inputs: threshold, expected_hash                                                         │
│ Proves: Balance >= threshold                                                                    │
│ ────────────────────────────────────────                                                        │
│ Circuit: kyc-attestation                                                                        │
│ Private Inputs: field hashes, provider, timestamp                                               │
│ Public Inputs: attestation_hash, min_provider_level                                             │
│ Proves: KYC completed at required level                                                         │
│ ────────────────────────────────────────                                                        │
│ Circuit: transaction-pattern                                                                    │
│ Private Inputs: 100 tx statuses/amounts, count                                                  │
│ Public Inputs: expected_hash, max_bounced                                                       │
│ Proves: Bounced txns below limit                                                                │
│ ────────────────────────────────────────                                                        │
│ Circuit: selective-disclosure                                                                   │
│ Private Inputs: 5 account fields                                                                │
│ Public Inputs: disclosure_mask, disclosed_values, record_hash                                   │
│ Proves: Selected fields match record                                                            │
│ ────────────────────────────────────────                                                        │
│ Circuit: merkle-membership                                                                      │
│ Private Inputs: leaf, index, 20-node path                                                       │
│ Public Inputs: root                                                                             │
│ Proves: User exists in verified set                                                             │
│                                                                                                 │
│ All circuits are well within browser WASM limits (~2K-10K gates each, limit is 524K).           │
│                                                                                                 │
│ Example circuit (income-range/src/main.nr):                                                     │
│ fn main(                                                                                        │
│     monthly_credits: [u64; 12],          // Private: actual monthly income                      │
│     data_hash: Field,                     // Private: hash of source FI data                    │
│     min_income: pub u64,                  // Public: lower bound                                │
│     max_income: pub u64,                  // Public: upper bound                                │
│     expected_data_hash: pub Field         // Public: verifier checks integrity                  │
│ ) {                                                                                             │
│     // Verify data integrity against AA-provided commitment                                     │
│     let computed_hash = std::hash::poseidon::bn254::hash_12(                                    │
│         monthly_credits.map(|c| c as Field)                                                     │
│     );                                                                                          │
│     assert(computed_hash == expected_data_hash);                                                │
│                                                                                                 │
│     // Compute and range-check total income                                                     │
│     let mut total: u64 = 0;                                                                     │
│     for i in 0..12 { total += monthly_credits[i]; }                                             │
│     assert(total >= min_income);                                                                │
│     assert(total <= max_income);                                                                │
│ }                                                                                               │
│                                                                                                 │
│ Browser integration (apps/web/src/lib/zk/noir-client.ts):                                       │
│ - Load compiled ACIR JSON from /public/circuits/                                                │
│ - Initialize NoirJS + UltraHonkBackend (bb.js WASM)                                             │
│ - Execute circuit with private inputs → generate witness → generate proof                       │
│ - Proof generation happens entirely client-side (5-30 sec)                                      │
│ - Raw financial data never leaves the browser                                                   │
│                                                                                                 │
│ Frontend proof UI: Circuit-specific forms, progress indicator during proving, proof receipt     │
│ display, "Share proof" button                                                                   │
│                                                                                                 │
│ Phase 5: ONDC Integration & Data Sharing (Weeks 14-16)                                          │
│                                                                                                 │
│ Goal: ONDC financial product discovery, proof-gated third-party sharing.                        │
│                                                                                                 │
│ 1. Build packages/ondc-client:                                                                  │
│   - Beckn protocol adapter (BAP role)                                                           │
│   - Support for /search, /select, /init, /confirm with callback handlers                        │
│   - Financial product catalog parsing (loans, insurance, mutual funds)                          │
│ 2. Proof-gated sharing (apps/api/src/modules/sharing/):                                         │
│   - POST /api/share — create share intent linking proof + recipient + expiry                    │
│   - GET /api/share/:token — third-party retrieval endpoint                                      │
│   - SharingGuard: Verify ZK proof server-side via bb.js before serving any data                 │
│   - Third parties receive proof metadata + public inputs only, never raw FI data                │
│   - Optional: share subset of raw data only if user explicitly consents AND a                   │
│ selective-disclosure proof covers it                                                            │
│ 3. Third-party verification API:                                                                │
│   - POST /api/verify/proof — public endpoint, returns { valid, circuitType, publicInputs }      │
│ 4. ONDC order flow: attach ZK proofs to loan/insurance applications via /init                   │
│                                                                                                 │
│ Phase 6: Hardening & Production (Weeks 17-20)                                                   │
│                                                                                                 │
│ Goal: Security, compliance, monitoring, deployment.                                             │
│                                                                                                 │
│ - Security: Pen testing, OWASP review, CSP/CORS, rate limiting, JWS verification on all         │
│ webhooks                                                                                        │
│ - Compliance: RBI AA guidelines, DPDP Act 2023, ReBIT v2.0.0, Sahamati Fair Use templates       │
│ - Monitoring: OpenTelemetry + Grafana (consent funnel, FI fetch latency, proof gen times)       │
│ - Performance: Circuit gate count optimization, proof generation benchmarks, DB indexing, CDN   │
│ for ACIR files                                                                                  │
│ - Deployment: Dockerize all services, TLS everywhere, secrets via Vault/KMS, blue-green deploys │
│                                                                                                 │
│ ---                                                                                             │
│ Key Data Flows                                                                                  │
│                                                                                                 │
│ Consent → FI Data → ZK Proof → Share                                                            │
│                                                                                                 │
│ 1. User creates consent → Backend calls Setu → User approves on AA portal                       │
│ 2. Setu webhook notifies ACTIVE → Backend creates data session → Fetches encrypted FI data      │
│ 3. Backend decrypts FI, parses by type, re-encrypts to MinIO, computes Poseidon data hash       │
│ 4. User opens proof page → Browser loads ACIR circuit + FI data + data hash                     │
│ 5. Browser generates ZK proof locally (NoirJS + bb.js WASM) — raw data stays in browser         │
│ 6. Proof sent to server → Server verifies with bb.js → Stores verified proof                    │
│ 7. User creates share (proof + recipient + expiry) → Third party fetches via token              │
│ 8. Server re-verifies proof, returns proof metadata + public inputs (NEVER raw data)            │
│                                                                                                 │
│ eKYC → Attestation → ZK KYC Proof                                                               │
│                                                                                                 │
│ 1. User completes Aadhaar/DigiLocker/PAN eKYC → Server receives verified identity data          │
│ 2. Server hashes each field with Poseidon, computes attestation hash, deletes raw data          │
│ 3. User loads kyc-attestation circuit in browser with field hashes as private inputs            │
│ 4. Browser generates proof that KYC was completed at required level                             │
│ 5. Third party verifies: "this user completed Aadhaar-level KYC" without seeing any documents   │
│                                                                                                 │
│ ---                                                                                             │
│ Security Architecture                                                                           │
│                                                                                                 │
│ - Data never leaves browser: Private witness inputs (balances, income, KYC fields) stay         │
│ client-side during proof generation                                                             │
│ - Poseidon commitments as trust bridge: Server computes hashes from AA/eKYC data at ingestion.  │
│ ZK circuits verify private inputs match these commitments — users cannot fabricate data         │
│ - JWS on all AA communication: Detached JWS signatures per ReBIT v2.0.0 spec on outgoing        │
│ requests; verify incoming webhooks against AA public key from Central Registry                  │
│ - Encrypted at rest: AES-256-GCM with per-user keys stored in Vault/KMS                         │
│ - Raw eKYC deleted: Only Poseidon hashes retained after verification                            │
│ - Proof-gated sharing: Third parties receive cryptographic proofs, never raw financial data     │
│ - Audit trail: Every data access event logged with user, timestamp, action, resource            │
│                                                                                                 │
│ ---                                                                                             │
│ Testing Strategy                                                                                │
│                                                                                                 │
│ Layer: ZK Circuits                                                                              │
│ Framework: nargo test (Noir built-in)                                                           │
│ Focus: Happy path, boundary conditions, negative cases, hash integrity                          │
│ ────────────────────────────────────────                                                        │
│ Layer: Unit                                                                                     │
│ Framework: Jest (NestJS) + Vitest (Next.js)                                                     │
│ Focus: Services, parsers, JWS utils, encryption, Poseidon hashing                               │
│ ────────────────────────────────────────                                                        │
│ Layer: Integration                                                                              │
│ Framework: Jest + Supertest                                                                     │
│ Focus: Full consent flow vs Setu sandbox, webhook JWS verification, BullMQ jobs                 │
│ ────────────────────────────────────────                                                        │
│ Layer: E2E                                                                                      │
│ Framework: Playwright                                                                           │
│ Focus: Registration, consent flow, proof generation in browser, sharing flow                    │
│ ────────────────────────────────────────                                                        │
│ Layer: Performance                                                                              │
│ Framework: k6                                                                                   │
│ Focus: API load testing; browser proof generation benchmarks per circuit                        │
│ ────────────────────────────────────────                                                        │
│ Layer: Security                                                                                 │
│ Framework: Manual + automated                                                                   │
│ Focus: JWS fuzzing, auth bypass, proof forgery, injection testing                               │
│                                                                                                 │
│ ---                                                                                             │
│ Verification Plan                                                                               │
│                                                                                                 │
│ 1. Phase 1: docker-compose up starts all infra, npx prisma migrate dev applies schema, login    │
│ via OTP works                                                                                   │
│ 2. Phase 2: Create consent in UI → redirects to Setu sandbox → webhook updates status → FI data │
│  displays in dashboard                                                                          │
│ 3. Phase 3: Complete Aadhaar eKYC in sandbox → attestation hash stored → raw data deleted       │
│ 4. Phase 4: Open proof page → select income range circuit → generate proof in browser → submit  │
│ → server verifies → proof appears in list                                                       │
│ 5. Phase 5: Create share → copy token → hit /api/share/:token → get verified proof metadata (no │
│  raw data)                                                                                      │
│ 6. Phase 6: Run full test suite, verify monitoring dashboards, deploy to staging                │
╰─────────────────────────────────────────────────────────────────────────────────────────────────╯

