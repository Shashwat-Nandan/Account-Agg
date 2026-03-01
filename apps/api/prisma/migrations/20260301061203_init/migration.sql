-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'REVOKED', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DataSessionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "KycProvider" AS ENUM ('AADHAAR', 'DIGILOCKER', 'PAN', 'CKYC');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CircuitType" AS ENUM ('INCOME_RANGE', 'BALANCE_THRESHOLD', 'KYC_ATTESTATION', 'TRANSACTION_PATTERN', 'SELECTIVE_DISCLOSURE', 'MERKLE_MEMBERSHIP');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('GENERATING', 'VERIFIED', 'INVALID', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setuConsentId" TEXT,
    "consentHandle" TEXT,
    "vua" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "fiTypes" TEXT[],
    "purpose" TEXT NOT NULL,
    "purposeCode" TEXT,
    "approvalUrl" TEXT,
    "dataRangeFrom" TIMESTAMP(3) NOT NULL,
    "dataRangeTo" TIMESTAMP(3) NOT NULL,
    "consentStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentExpiry" TIMESTAMP(3) NOT NULL,
    "fetchType" TEXT NOT NULL DEFAULT 'ONETIME',
    "consentMode" TEXT NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSession" (
    "id" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setuSessionId" TEXT,
    "status" "DataSessionStatus" NOT NULL DEFAULT 'PENDING',
    "fiDataRef" TEXT,
    "dataHash" TEXT,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "KycProvider" NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "providerLevel" INTEGER NOT NULL DEFAULT 0,
    "attestationHash" TEXT,
    "nameHash" TEXT,
    "dobHash" TEXT,
    "panHash" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "circuitType" "CircuitType" NOT NULL,
    "publicInputs" JSONB NOT NULL,
    "proofData" TEXT NOT NULL,
    "proofHash" TEXT NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'GENERATING',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "maxAccess" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_setuConsentId_key" ON "Consent"("setuConsentId");

-- CreateIndex
CREATE UNIQUE INDEX "Consent_consentHandle_key" ON "Consent"("consentHandle");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE INDEX "Consent_setuConsentId_idx" ON "Consent"("setuConsentId");

-- CreateIndex
CREATE INDEX "Consent_status_idx" ON "Consent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DataSession_setuSessionId_key" ON "DataSession"("setuSessionId");

-- CreateIndex
CREATE INDEX "DataSession_consentId_idx" ON "DataSession"("consentId");

-- CreateIndex
CREATE INDEX "DataSession_userId_idx" ON "DataSession"("userId");

-- CreateIndex
CREATE INDEX "DataSession_setuSessionId_idx" ON "DataSession"("setuSessionId");

-- CreateIndex
CREATE INDEX "KycRecord_userId_idx" ON "KycRecord"("userId");

-- CreateIndex
CREATE INDEX "KycRecord_attestationHash_idx" ON "KycRecord"("attestationHash");

-- CreateIndex
CREATE UNIQUE INDEX "KycRecord_userId_provider_key" ON "KycRecord"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Proof_proofHash_key" ON "Proof"("proofHash");

-- CreateIndex
CREATE INDEX "Proof_userId_idx" ON "Proof"("userId");

-- CreateIndex
CREATE INDEX "Proof_circuitType_idx" ON "Proof"("circuitType");

-- CreateIndex
CREATE INDEX "Proof_proofHash_idx" ON "Proof"("proofHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProofShare_shareToken_key" ON "ProofShare"("shareToken");

-- CreateIndex
CREATE INDEX "ProofShare_shareToken_idx" ON "ProofShare"("shareToken");

-- CreateIndex
CREATE INDEX "ProofShare_userId_idx" ON "ProofShare"("userId");

-- CreateIndex
CREATE INDEX "ProofShare_proofId_idx" ON "ProofShare"("proofId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "OtpSession_phone_idx" ON "OtpSession"("phone");

-- CreateIndex
CREATE INDEX "OtpSession_expiresAt_idx" ON "OtpSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSession" ADD CONSTRAINT "DataSession_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "Consent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSession" ADD CONSTRAINT "DataSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycRecord" ADD CONSTRAINT "KycRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofShare" ADD CONSTRAINT "ProofShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofShare" ADD CONSTRAINT "ProofShare_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "Proof"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
