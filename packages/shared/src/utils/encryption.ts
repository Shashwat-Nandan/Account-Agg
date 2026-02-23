import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

export interface EncryptedPayload {
  iv: string;       // hex
  tag: string;      // hex
  ciphertext: string; // hex
}

/**
 * Encrypt data with AES-256-GCM.
 * Returns IV, auth tag, and ciphertext as hex strings.
 */
export function encryptAES256GCM(
  plaintext: string,
  keyHex: string,
): EncryptedPayload {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext,
  };
}

/**
 * Decrypt AES-256-GCM encrypted data.
 */
export function decryptAES256GCM(
  encrypted: EncryptedPayload,
  keyHex: string,
): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(encrypted.iv, 'hex');
  const tag = Buffer.from(encrypted.tag, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');

  return plaintext;
}

/**
 * Generate a random 256-bit encryption key.
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
}
