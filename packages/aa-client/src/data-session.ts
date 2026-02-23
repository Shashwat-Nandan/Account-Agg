import { SetuClient } from './setu-client';
import { createECDH, createDecipheriv } from 'node:crypto';

export interface DecryptedFIData {
  fipId: string;
  accounts: Array<{
    linkRefNumber: string;
    maskedAccNumber: string;
    fiData: unknown; // Parsed XML/JSON financial data
  }>;
}

export class DataSessionHandler {
  constructor(private readonly client: SetuClient) {}

  async createSession(consentId: string, dateRange: { from: string; to: string }) {
    return this.client.createDataSession({ consentId, dataRange: dateRange });
  }

  async fetchData(sessionId: string) {
    return this.client.fetchFIData(sessionId);
  }

  /**
   * Decrypt FI data from Setu using ECDH key exchange.
   *
   * Setu encrypts FI data using:
   * 1. ECDH to derive shared secret (using Curve25519)
   * 2. AES-256-GCM with the derived key
   *
   * In production, the private key is generated per-session
   * via Setu's Rahasya service.
   */
  async decryptFIData(
    encryptedPayload: {
      encryptedFI: string;
      KeyMaterial: {
        cryptoAlg: string;
        curve: string;
        DHPublicKey: { KeyValue: string };
        Nonce: string;
      };
    },
    ourPrivateKey: string,
    ourNonce: string,
  ): Promise<string> {
    const { KeyMaterial, encryptedFI } = encryptedPayload;

    // Derive shared secret via ECDH
    const ecdh = createECDH('prime256v1');
    ecdh.setPrivateKey(Buffer.from(ourPrivateKey, 'base64'));

    const remotePublicKey = Buffer.from(KeyMaterial.DHPublicKey.KeyValue, 'base64');
    const sharedSecret = ecdh.computeSecret(remotePublicKey);

    // Derive encryption key using XOR of nonces
    const remoteNonce = Buffer.from(KeyMaterial.Nonce, 'base64');
    const localNonce = Buffer.from(ourNonce, 'base64');
    const xorNonce = Buffer.alloc(remoteNonce.length);
    for (let i = 0; i < remoteNonce.length; i++) {
      xorNonce[i] = remoteNonce[i]! ^ (localNonce[i] || 0);
    }

    // Use first 32 bytes of shared secret + nonce as AES key
    const keyMaterial = Buffer.concat([sharedSecret, xorNonce]).subarray(0, 32);

    // Decrypt with AES-256-GCM
    const encryptedBuffer = Buffer.from(encryptedFI, 'base64');
    const iv = encryptedBuffer.subarray(0, 12);
    const tag = encryptedBuffer.subarray(encryptedBuffer.length - 16);
    const ciphertext = encryptedBuffer.subarray(12, encryptedBuffer.length - 16);

    const decipher = createDecipheriv('aes-256-gcm', keyMaterial, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
