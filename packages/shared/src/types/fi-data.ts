export enum FIType {
  DEPOSIT = 'DEPOSIT',
  TERM_DEPOSIT = 'TERM_DEPOSIT',
  RECURRING_DEPOSIT = 'RECURRING_DEPOSIT',
  MUTUAL_FUNDS = 'MUTUAL_FUNDS',
  ETF = 'ETF',
  EQUITIES = 'EQUITIES',
  BONDS = 'BONDS',
  DEBENTURES = 'DEBENTURES',
  SIP = 'SIP',
  GOVT_SECURITIES = 'GOVT_SECURITIES',
  INSURANCE_POLICIES = 'INSURANCE_POLICIES',
  NPS = 'NPS',
  INVIT = 'INVIT',
  REIT = 'REIT',
  PPF = 'PPF',
  EPF = 'EPF',
  CREDIT_CARD = 'CREDIT_CARD',
}

export enum DataSessionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
}

export interface EncryptedFIData {
  fipId: string;
  data: Array<{
    linkRefNumber: string;
    maskedAccNumber: string;
    encryptedFI: string;
  }>;
  KeyMaterial: {
    cryptoAlg: string;
    curve: string;
    params: string;
    DHPublicKey: { expiry: string; Parameters: string; KeyValue: string };
    Nonce: string;
  };
}

export interface ParsedAccount {
  accountType: FIType;
  fipId: string;
  linkRefNumber: string;
  maskedAccNumber: string;
  summary: AccountSummary;
  transactions: Transaction[];
}

export interface AccountSummary {
  currentBalance: number;
  currency: string;
  branch?: string;
  ifscCode?: string;
  accountHolderName?: string;
  openingDate?: string;
  status?: string;
}

export interface Transaction {
  txnId: string;
  type: 'CREDIT' | 'DEBIT';
  mode: string;
  amount: number;
  currentBalance: number;
  transactionTimestamp: string;
  narration: string;
  reference?: string;
  valueDate?: string;
}

export interface DataSessionResponse {
  id: string;
  consentId: string;
  status: DataSessionStatus;
  accounts: ParsedAccount[];
  dataHash: string; // Poseidon hash commitment
  fetchedAt?: string;
}

export interface FINotificationPayload {
  ver: string;
  timestamp: string;
  txnid: string;
  Notifier: { type: string; id: string };
  FIStatusNotification: {
    sessionId: string;
    sessionStatus: DataSessionStatus;
    FIStatusResponse: Array<{
      fipID: string;
      Accounts: Array<{
        linkRefNumber: string;
        FIStatus: string;
        description?: string;
      }>;
    }>;
  };
}
