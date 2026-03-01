import { createHash } from 'node:crypto';

/**
 * Compute a SHA-256 hash of the input string.
 * Placeholder for Pedersen hash — in production, replace with a
 * Pedersen implementation to match the Noir circuit hashing.
 */
export function hashCommitment(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
