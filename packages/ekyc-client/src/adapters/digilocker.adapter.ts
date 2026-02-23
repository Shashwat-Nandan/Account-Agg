import axios, { AxiosInstance } from 'axios';
import type { DigiLockerDocument } from '@account-agg/shared';

export interface DigiLockerConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class DigiLockerAdapter {
  private readonly config: DigiLockerConfig;
  private readonly http: AxiosInstance;

  constructor(config: DigiLockerConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: 'https://digilocker.meripehchaan.gov.in',
    });
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
    });
    return `https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<{ accessToken: string }> {
    const response = await this.http.post('/public/oauth2/1/token', {
      code,
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: this.config.redirectUri,
    });

    return { accessToken: response.data.access_token };
  }

  async pullDocument(
    accessToken: string,
    docType: string,
  ): Promise<DigiLockerDocument> {
    const response = await this.http.get(`/public/oauth2/2/pull/${docType}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return {
      docType,
      uri: response.data.uri || response.data.docUri,
      name: response.data.name || response.data.docName,
      issueDate: response.data.issueDate,
      issuerId: response.data.issuerId,
    };
  }
}
