export enum OndcDomain {
  FINANCIAL_SERVICES = 'ONDC:FIS12',
}

export enum OndcAction {
  SEARCH = 'search',
  ON_SEARCH = 'on_search',
  SELECT = 'select',
  ON_SELECT = 'on_select',
  INIT = 'init',
  ON_INIT = 'on_init',
  CONFIRM = 'confirm',
  ON_CONFIRM = 'on_confirm',
  STATUS = 'status',
  ON_STATUS = 'on_status',
  CANCEL = 'cancel',
  ON_CANCEL = 'on_cancel',
}

export interface BecknContext {
  domain: OndcDomain;
  action: OndcAction;
  country: string;
  city: string;
  bap_id: string;
  bap_uri: string;
  bpp_id?: string;
  bpp_uri?: string;
  transaction_id: string;
  message_id: string;
  timestamp: string;
  ttl?: string;
}

export interface BecknMessage<T = unknown> {
  context: BecknContext;
  message: T;
}

export interface FinancialProduct {
  id: string;
  descriptor: {
    name: string;
    short_desc?: string;
    long_desc?: string;
    images?: Array<{ url: string }>;
  };
  category_id: string; // LOAN, INSURANCE, MUTUAL_FUND
  provider: {
    id: string;
    descriptor: { name: string; images?: Array<{ url: string }> };
  };
  price?: { currency: string; value: string };
  tags?: Array<{ descriptor: { name: string }; list: Array<{ descriptor: { name: string }; value: string }> }>;
}

export interface LoanSearchIntent {
  category: 'PERSONAL_LOAN' | 'HOME_LOAN' | 'VEHICLE_LOAN' | 'BUSINESS_LOAN';
  amount?: number;
  tenure?: number; // months
}

export interface InsuranceSearchIntent {
  category: 'HEALTH' | 'LIFE' | 'MOTOR' | 'TRAVEL';
  sumInsured?: number;
}

export interface OndcOrderWithProof {
  orderId: string;
  productId: string;
  proofIds: string[]; // ZK proofs to attach
  customerDetails: {
    name: string;
    phone: string;
    email?: string;
  };
}
