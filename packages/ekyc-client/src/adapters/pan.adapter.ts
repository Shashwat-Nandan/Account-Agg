import axios, { AxiosInstance } from 'axios';
import type { PanVerifyResponse } from '@account-agg/shared';

export interface PanConfig {
  baseUrl: string;
  apiKey?: string;
}

export class PanAdapter {
  private readonly http: AxiosInstance;

  constructor(config: PanConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'x-api-key': config.apiKey }),
      },
    });
  }

  async verify(pan: string, name: string, dob?: string): Promise<PanVerifyResponse> {
    const response = await this.http.post('/pan/verify', { pan, name, dob });

    return {
      valid: response.data.valid ?? response.data.isValid ?? true,
      nameMatch: response.data.nameMatch ?? response.data.nameMatched ?? true,
      panStatus: response.data.status || 'ACTIVE',
    };
  }
}
