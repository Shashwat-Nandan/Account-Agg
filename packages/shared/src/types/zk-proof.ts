export enum CircuitType {
  INCOME_RANGE = 'income-range',
  BALANCE_THRESHOLD = 'balance-threshold',
  KYC_ATTESTATION = 'kyc-attestation',
  TRANSACTION_PATTERN = 'transaction-pattern',
  SELECTIVE_DISCLOSURE = 'selective-disclosure',
  MERKLE_MEMBERSHIP = 'merkle-membership',
}

export enum ProofStatus {
  GENERATING = 'GENERATING',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED',
}

export interface IncomeRangePublicInputs {
  minIncome: number;
  maxIncome: number;
  expectedDataHash: string;
}

export interface BalanceThresholdPublicInputs {
  threshold: number;
  expectedHash: string;
}

export interface KycAttestationPublicInputs {
  attestationHash: string;
  minProviderLevel: number;
}

export interface TransactionPatternPublicInputs {
  expectedHash: string;
  maxBounced: number;
}

export interface SelectiveDisclosurePublicInputs {
  disclosureMask: number; // bitmask of revealed fields
  disclosedValues: string[];
  recordHash: string;
}

export interface MerkleMembershipPublicInputs {
  root: string;
}

export type PublicInputs =
  | IncomeRangePublicInputs
  | BalanceThresholdPublicInputs
  | KycAttestationPublicInputs
  | TransactionPatternPublicInputs
  | SelectiveDisclosurePublicInputs
  | MerkleMembershipPublicInputs;

export interface ProofData {
  proof: Uint8Array | string; // serialized proof bytes
  verificationKey?: string;
}

export interface ProofResponse {
  id: string;
  userId: string;
  circuitType: CircuitType;
  publicInputs: PublicInputs;
  status: ProofStatus;
  verified: boolean;
  proofHash: string;
  createdAt: string;
  expiresAt?: string;
}

export interface GenerateProofRequest {
  circuitType: CircuitType;
  privateInputs: Record<string, unknown>;
  publicInputs: PublicInputs;
}

export interface VerifyProofRequest {
  circuitType: CircuitType;
  proof: string; // base64-encoded proof
  publicInputs: PublicInputs;
}

export interface VerifyProofResponse {
  valid: boolean;
  circuitType: CircuitType;
  publicInputs: PublicInputs;
  verifiedAt: string;
}
