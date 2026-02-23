import axios, { AxiosInstance } from 'axios';
import { createDetachedJws } from '@account-agg/shared';

export interface SetuConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  productInstanceId: string;
  privateKeyPem: string;
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

export class SetuClient {
  private readonly http: AxiosInstance;
  private readonly config: SetuConfig;
  private tokenCache: TokenCache | null = null;

  constructor(config: SetuConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-product-instance-id': config.productInstanceId,
      },
    });

    // JWS interceptor — attach detached JWS to every request
    this.http.interceptors.request.use(async (reqConfig) => {
      // Attach bearer token
      const token = await this.getAccessToken();
      reqConfig.headers.Authorization = `Bearer ${token}`;

      // Attach detached JWS for request body
      if (reqConfig.data) {
        const body = JSON.stringify(reqConfig.data);
        const jws = await createDetachedJws(body, this.config.privateKeyPem);
        reqConfig.headers['x-jws-signature'] = jws;
      }

      return reqConfig;
    });
  }

  async getAccessToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const response = await axios.post(
      `${this.config.baseUrl}/v2/token`,
      {
        clientID: this.config.clientId,
        secret: this.config.clientSecret,
      },
    );

    this.tokenCache = {
      token: response.data.token,
      expiresAt: Date.now() + (response.data.expiresIn || 3600) * 1000 - 60000,
    };

    return this.tokenCache.token;
  }

  async createConsent(consentDetail: Record<string, unknown>) {
    const response = await this.http.post('/consents', consentDetail);
    return response.data;
  }

  async getConsentStatus(consentId: string) {
    const response = await this.http.get(`/consents/${consentId}`);
    return response.data;
  }

  async revokeConsent(consentId: string) {
    const response = await this.http.post(`/consents/${consentId}/revoke`);
    return response.data;
  }

  async createDataSession(params: {
    consentId: string;
    dataRange: { from: string; to: string };
  }) {
    const response = await this.http.post('/sessions', {
      consentId: params.consentId,
      DataRange: {
        from: params.dataRange.from,
        to: params.dataRange.to,
      },
    });
    return response.data;
  }

  async fetchFIData(sessionId: string) {
    const response = await this.http.get(`/sessions/${sessionId}`);
    return response.data;
  }
}
