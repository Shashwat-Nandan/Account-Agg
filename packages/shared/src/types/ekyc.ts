export enum KycProvider {
  AADHAAR = 'AADHAAR',
  DIGILOCKER = 'DIGILOCKER',
  PAN = 'PAN',
  CKYC = 'CKYC',
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum KycProviderLevel {
  BASIC = 1,   // PAN only
  STANDARD = 2, // DigiLocker
  FULL = 3,     // Aadhaar eKYC
  CKYC = 4,     // Central KYC
}

export interface AadhaarOtpRequest {
  aadhaarNumber: string;
}

export interface AadhaarOtpVerifyRequest {
  transactionId: string;
  otp: string;
}

export interface AadhaarKycResponse {
  name: string;
  dob: string;
  gender: string;
  address: {
    house?: string;
    street?: string;
    landmark?: string;
    locality?: string;
    district?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  photo?: string; // Base64
}

export interface DigiLockerAuthUrl {
  authorizationUrl: string;
  state: string;
}

export interface DigiLockerDocument {
  docType: string;
  uri: string;
  name: string;
  issueDate?: string;
  issuerId?: string;
}

export interface PanVerifyRequest {
  pan: string;
  name: string;
  dob?: string;
}

export interface PanVerifyResponse {
  valid: boolean;
  nameMatch: boolean;
  panStatus: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED';
}

export interface CkycSearchRequest {
  searchBy: 'PAN' | 'AADHAAR' | 'CKYC_NUMBER';
  searchValue: string;
}

export interface KycRecordResponse {
  id: string;
  userId: string;
  provider: KycProvider;
  status: KycStatus;
  providerLevel: KycProviderLevel;
  attestationHash: string;
  verifiedAt?: string;
  createdAt: string;
}

export interface KycAttestationInput {
  nameHash: string;
  dobHash: string;
  panHash: string;
  provider: KycProvider;
  timestamp: number;
}
