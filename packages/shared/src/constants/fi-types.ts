import { FIType } from '../types/fi-data';

export const FI_TYPE_LABELS: Record<FIType, string> = {
  [FIType.DEPOSIT]: 'Savings/Current Account',
  [FIType.TERM_DEPOSIT]: 'Fixed Deposit',
  [FIType.RECURRING_DEPOSIT]: 'Recurring Deposit',
  [FIType.MUTUAL_FUNDS]: 'Mutual Funds',
  [FIType.ETF]: 'Exchange Traded Funds',
  [FIType.EQUITIES]: 'Equities',
  [FIType.BONDS]: 'Bonds',
  [FIType.DEBENTURES]: 'Debentures',
  [FIType.SIP]: 'Systematic Investment Plan',
  [FIType.GOVT_SECURITIES]: 'Government Securities',
  [FIType.INSURANCE_POLICIES]: 'Insurance Policies',
  [FIType.NPS]: 'National Pension System',
  [FIType.INVIT]: 'Infrastructure Investment Trust',
  [FIType.REIT]: 'Real Estate Investment Trust',
  [FIType.PPF]: 'Public Provident Fund',
  [FIType.EPF]: 'Employee Provident Fund',
  [FIType.CREDIT_CARD]: 'Credit Card',
};

export const FI_TYPE_CATEGORIES: Record<string, FIType[]> = {
  'Bank Accounts': [FIType.DEPOSIT, FIType.TERM_DEPOSIT, FIType.RECURRING_DEPOSIT],
  'Investments': [FIType.MUTUAL_FUNDS, FIType.ETF, FIType.EQUITIES, FIType.SIP],
  'Fixed Income': [FIType.BONDS, FIType.DEBENTURES, FIType.GOVT_SECURITIES],
  'Retirement': [FIType.NPS, FIType.PPF, FIType.EPF],
  'Others': [FIType.INSURANCE_POLICIES, FIType.INVIT, FIType.REIT, FIType.CREDIT_CARD],
};

export const FI_TYPE_FIP_MAPPING: Record<string, FIType[]> = {
  BANK: [FIType.DEPOSIT, FIType.TERM_DEPOSIT, FIType.RECURRING_DEPOSIT, FIType.CREDIT_CARD, FIType.PPF],
  AMC: [FIType.MUTUAL_FUNDS, FIType.SIP, FIType.ETF],
  DEPOSITORY: [FIType.EQUITIES, FIType.BONDS, FIType.DEBENTURES, FIType.GOVT_SECURITIES],
  INSURANCE: [FIType.INSURANCE_POLICIES],
  PENSION: [FIType.NPS, FIType.EPF],
};
