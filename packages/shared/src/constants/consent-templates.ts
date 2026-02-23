import { ConsentMode, FetchType } from '../types/consent';

export interface ConsentTemplate {
  id: string;
  name: string;
  description: string;
  purposeCode: string;
  purposeText: string;
  purposeRefUri: string;
  consentMode: ConsentMode;
  fetchType: FetchType;
  fiTypes: string[];
  dataLifeUnit: string;
  dataLifeValue: number;
  frequencyUnit: 'HOUR' | 'DAY' | 'MONTH' | 'YEAR';
  frequencyValue: number;
}

/**
 * Sahamati Fair Use Templates for common use cases.
 * These align with ReBIT v2.0.0 consent purpose codes.
 */
export const CONSENT_TEMPLATES: ConsentTemplate[] = [
  {
    id: 'loan-underwriting',
    name: 'Loan Underwriting',
    description: 'Share financial data for loan eligibility assessment',
    purposeCode: '101',
    purposeText: 'Wealth management service',
    purposeRefUri: 'https://api.rebit.org.in/aa/purpose/101.xml',
    consentMode: ConsentMode.VIEW,
    fetchType: FetchType.ONETIME,
    fiTypes: ['DEPOSIT', 'CREDIT_CARD'],
    dataLifeUnit: 'DAY',
    dataLifeValue: 1,
    frequencyUnit: 'DAY',
    frequencyValue: 1,
  },
  {
    id: 'wealth-management',
    name: 'Wealth Management',
    description: 'Comprehensive portfolio review for financial planning',
    purposeCode: '102',
    purposeText: 'Financial reporting',
    purposeRefUri: 'https://api.rebit.org.in/aa/purpose/102.xml',
    consentMode: ConsentMode.VIEW,
    fetchType: FetchType.PERIODIC,
    fiTypes: ['DEPOSIT', 'MUTUAL_FUNDS', 'EQUITIES', 'ETF', 'SIP', 'NPS', 'PPF', 'EPF'],
    dataLifeUnit: 'MONTH',
    dataLifeValue: 6,
    frequencyUnit: 'MONTH',
    frequencyValue: 1,
  },
  {
    id: 'insurance-underwriting',
    name: 'Insurance Underwriting',
    description: 'Financial assessment for insurance premium calculation',
    purposeCode: '103',
    purposeText: 'Insurance service',
    purposeRefUri: 'https://api.rebit.org.in/aa/purpose/103.xml',
    consentMode: ConsentMode.VIEW,
    fetchType: FetchType.ONETIME,
    fiTypes: ['DEPOSIT', 'INSURANCE_POLICIES'],
    dataLifeUnit: 'DAY',
    dataLifeValue: 1,
    frequencyUnit: 'DAY',
    frequencyValue: 1,
  },
  {
    id: 'credit-score',
    name: 'Credit Score Check',
    description: 'Account data for credit score computation',
    purposeCode: '104',
    purposeText: 'Customer spending patterns, currentBalance analysis',
    purposeRefUri: 'https://api.rebit.org.in/aa/purpose/104.xml',
    consentMode: ConsentMode.VIEW,
    fetchType: FetchType.ONETIME,
    fiTypes: ['DEPOSIT', 'CREDIT_CARD'],
    dataLifeUnit: 'DAY',
    dataLifeValue: 1,
    frequencyUnit: 'DAY',
    frequencyValue: 1,
  },
  {
    id: 'personal-finance',
    name: 'Personal Finance Management',
    description: 'Aggregate your accounts for personal finance tracking',
    purposeCode: '105',
    purposeText: 'Personal finance management service',
    purposeRefUri: 'https://api.rebit.org.in/aa/purpose/105.xml',
    consentMode: ConsentMode.STORE,
    fetchType: FetchType.PERIODIC,
    fiTypes: ['DEPOSIT', 'MUTUAL_FUNDS', 'EQUITIES', 'CREDIT_CARD'],
    dataLifeUnit: 'YEAR',
    dataLifeValue: 1,
    frequencyUnit: 'DAY',
    frequencyValue: 1,
  },
];
