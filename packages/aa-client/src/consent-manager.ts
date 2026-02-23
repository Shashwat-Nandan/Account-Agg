import { SetuClient } from './setu-client';
import { ConsentStatus } from '@account-agg/shared';

export class ConsentManager {
  constructor(private readonly client: SetuClient) {}

  async createAndTrack(params: {
    vua: string;
    fiTypes: string[];
    purpose: { code: string; text: string; refUri: string };
    dataRange: { from: string; to: string };
    consentDuration: { unit: string; value: number };
    dataLife: { unit: string; value: number };
    frequency: { unit: string; value: number };
    fetchType?: string;
    consentMode?: string;
  }) {
    const consentDetail = {
      consentStart: new Date().toISOString(),
      consentExpiry: this.computeExpiry(params.consentDuration),
      consentMode: params.consentMode || 'VIEW',
      fetchType: params.fetchType || 'ONETIME',
      consentTypes: ['PROFILE', 'SUMMARY', 'TRANSACTIONS'],
      fiTypes: params.fiTypes,
      DataConsumer: { id: 'FIU' },
      DataProvider: { id: 'FIP' },
      Customer: { id: params.vua },
      Purpose: {
        code: params.purpose.code,
        refUri: params.purpose.refUri,
        text: params.purpose.text,
        Category: { type: 'string' },
      },
      FIDataRange: {
        from: params.dataRange.from,
        to: params.dataRange.to,
      },
      DataLife: params.dataLife,
      Frequency: params.frequency,
    };

    const result = await this.client.createConsent(consentDetail);
    return {
      consentId: result.id || result.ConsentHandle,
      consentHandle: result.ConsentHandle,
      approvalUrl: result.url || result.RedirectUrl,
      status: ConsentStatus.PENDING,
    };
  }

  async pollStatus(
    consentId: string,
    intervalMs: number = 5000,
    maxAttempts: number = 60,
  ): Promise<{ status: ConsentStatus; consentId: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.client.getConsentStatus(consentId);
      const status = result.status || result.ConsentStatus?.status;

      if (
        status === ConsentStatus.ACTIVE ||
        status === ConsentStatus.REJECTED ||
        status === ConsentStatus.REVOKED
      ) {
        return { status, consentId };
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return { status: ConsentStatus.PENDING, consentId };
  }

  async revoke(consentId: string) {
    return this.client.revokeConsent(consentId);
  }

  private computeExpiry(duration: { unit: string; value: number }): string {
    const now = new Date();
    switch (duration.unit) {
      case 'DAY':
        now.setDate(now.getDate() + duration.value);
        break;
      case 'MONTH':
        now.setMonth(now.getMonth() + duration.value);
        break;
      case 'YEAR':
        now.setFullYear(now.getFullYear() + duration.value);
        break;
    }
    return now.toISOString();
  }
}
