import { importPKCS8, importSPKI, CompactSign, compactVerify } from 'jose';

const ALG = 'RS256';

/**
 * Create a detached JWS signature per ReBIT v2.0.0 spec.
 * The payload is removed from the JWS (detached content).
 */
export async function createDetachedJws(
  payload: string,
  privateKeyPem: string,
): Promise<string> {
  const privateKey = await importPKCS8(privateKeyPem, ALG);
  const encoder = new TextEncoder();

  const jws = await new CompactSign(encoder.encode(payload))
    .setProtectedHeader({ alg: ALG, b64: false, crit: ['b64'] })
    .sign(privateKey);

  // Detach the payload (second segment)
  const parts = jws.split('.');
  return `${parts[0]}..${parts[2]}`;
}

/**
 * Verify a detached JWS signature.
 * Re-attaches the payload before verification.
 */
export async function verifyDetachedJws(
  detachedJws: string,
  payload: string,
  publicKeyPem: string,
): Promise<boolean> {
  try {
    const publicKey = await importSPKI(publicKeyPem, ALG);
    const encoder = new TextEncoder();

    // Re-attach payload
    const parts = detachedJws.split('.');
    const payloadB64 = Buffer.from(payload).toString('base64url');
    const fullJws = `${parts[0]}.${payloadB64}.${parts[2]}`;

    await compactVerify(fullJws, publicKey);
    return true;
  } catch {
    return false;
  }
}
