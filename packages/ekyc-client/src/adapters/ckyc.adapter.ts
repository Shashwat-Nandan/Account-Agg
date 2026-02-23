import axios, { AxiosInstance } from 'axios';

export interface CkycConfig {
  baseUrl: string;
  apiKey?: string;
}

export class CkycAdapter {
  private readonly http: AxiosInstance;

  constructor(config: CkycConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'x-api-key': config.apiKey }),
      },
    });
  }

  async search(
    searchBy: 'PAN' | 'AADHAAR' | 'CKYC_NUMBER',
    value: string,
  ): Promise<{ found: boolean; ckycNumber?: string; records?: unknown[] }> {
    const response = await this.http.post('/search', { searchBy, searchValue: value });
    return {
      found: response.data.found ?? response.data.records?.length > 0,
      ckycNumber: response.data.ckycNumber,
      records: response.data.records,
    };
  }

  async downloadRecord(ckycNumber: string): Promise<{
    name: string;
    dob: string;
    pan?: string;
    address?: string;
  }> {
    const response = await this.http.get(`/records/${ckycNumber}`);
    return response.data;
  }
}
