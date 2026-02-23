export enum ConsentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  REJECTED = 'REJECTED',
}

export enum ConsentMode {
  VIEW = 'VIEW',
  STORE = 'STORE',
  QUERY = 'QUERY',
  STREAM = 'STREAM',
}

export enum FetchType {
  ONETIME = 'ONETIME',
  PERIODIC = 'PERIODIC',
}

export interface ConsentPurpose {
  code: string;
  refUri: string;
  text: string;
  category: { type: string };
}

export interface ConsentDateRange {
  from: string; // ISO 8601
  to: string;
}

export interface ConsentFrequency {
  unit: 'HOUR' | 'DAY' | 'MONTH' | 'YEAR';
  value: number;
}

export interface ConsentDetail {
  consentStart: string;
  consentExpiry: string;
  consentMode: ConsentMode;
  fetchType: FetchType;
  consentTypes: string[];
  fiTypes: string[];
  DataConsumer: { id: string };
  DataProvider: { id: string };
  Customer: { id: string };
  Purpose: ConsentPurpose;
  FIDataRange: ConsentDateRange;
  DataLife: { unit: string; value: number };
  Frequency: ConsentFrequency;
  DataFilter?: Array<{ type: string; operator: string; value: string }>;
}

export interface CreateConsentRequest {
  vua: string; // Virtual User Address (e.g., user@aa-provider)
  fiTypes: string[];
  purpose: string;
  dataRangeFrom: string;
  dataRangeTo: string;
  consentDurationDays?: number;
}

export interface ConsentResponse {
  id: string;
  setuConsentId: string;
  status: ConsentStatus;
  vua: string;
  fiTypes: string[];
  purpose: string;
  approvalUrl?: string;
  dataRangeFrom: string;
  dataRangeTo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentNotificationPayload {
  ver: string;
  timestamp: string;
  txnid: string;
  Notifier: { type: string; id: string };
  ConsentStatusNotification: {
    consentId: string;
    consentHandle: string;
    consentStatus: ConsentStatus;
  };
}
