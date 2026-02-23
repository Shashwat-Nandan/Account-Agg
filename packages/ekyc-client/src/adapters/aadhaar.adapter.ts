import axios, { AxiosInstance } from 'axios';
import type { AadhaarKycResponse } from '@account-agg/shared';

export interface AadhaarConfig {
  baseUrl: string;
  apiKey?: string;
}

export class AadhaarAdapter {
  private readonly http: AxiosInstance;

  constructor(config: AadhaarConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'x-api-key': config.apiKey }),
      },
    });
  }

  async requestOtp(aadhaarNumber: string): Promise<{ transactionId: string }> {
    const response = await this.http.post('/otp', {
      uid: aadhaarNumber,
    });
    return { transactionId: response.data.transactionId || response.data.txnId };
  }

  async verifyOtp(
    transactionId: string,
    otp: string,
  ): Promise<AadhaarKycResponse> {
    const response = await this.http.post('/otp/verify', {
      txnId: transactionId,
      otp,
    });

    const data = response.data;
    return {
      name: data.name || data.fullName,
      dob: data.dob || data.dateOfBirth,
      gender: data.gender,
      address: {
        house: data.address?.house,
        street: data.address?.street,
        landmark: data.address?.landmark,
        locality: data.address?.locality || data.address?.vtc,
        district: data.address?.district,
        state: data.address?.state,
        pincode: data.address?.pincode || data.address?.zip,
        country: data.address?.country || 'India',
      },
      photo: data.photo,
    };
  }
}
