import { CircuitType } from '@account-agg/shared';

export interface CompiledCircuit {
  bytecode: string;
  abi: {
    parameters: Array<{
      name: string;
      type: { kind: string };
      visibility: 'private' | 'public';
    }>;
    return_type: null | { kind: string };
  };
}

const circuitCache = new Map<string, CompiledCircuit>();

/**
 * Load a compiled ACIR circuit from /public/circuits/.
 * Circuits are compiled Noir programs (JSON with bytecode + ABI).
 */
export async function loadCircuit(
  circuitType: CircuitType,
): Promise<CompiledCircuit> {
  const cached = circuitCache.get(circuitType);
  if (cached) return cached;

  const circuitName = circuitType.replace(/-/g, '_');
  const url = `/circuits/${circuitName}.json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load circuit: ${circuitType} (${response.status})`);
  }

  const circuit = await response.json();
  circuitCache.set(circuitType, circuit);
  return circuit;
}

/**
 * Get circuit metadata without loading the full bytecode.
 */
export function getCircuitInfo(circuitType: CircuitType) {
  const circuits: Record<
    string,
    { name: string; gateCount: number; provingTime: string }
  > = {
    [CircuitType.INCOME_RANGE]: {
      name: 'Income Range Proof',
      gateCount: 5000,
      provingTime: '5-10s',
    },
    [CircuitType.BALANCE_THRESHOLD]: {
      name: 'Balance Threshold Proof',
      gateCount: 2000,
      provingTime: '3-5s',
    },
    [CircuitType.KYC_ATTESTATION]: {
      name: 'KYC Attestation Proof',
      gateCount: 3000,
      provingTime: '5-8s',
    },
    [CircuitType.TRANSACTION_PATTERN]: {
      name: 'Transaction Pattern Proof',
      gateCount: 10000,
      provingTime: '15-30s',
    },
    [CircuitType.SELECTIVE_DISCLOSURE]: {
      name: 'Selective Disclosure Proof',
      gateCount: 4000,
      provingTime: '5-10s',
    },
    [CircuitType.MERKLE_MEMBERSHIP]: {
      name: 'Merkle Membership Proof',
      gateCount: 8000,
      provingTime: '10-20s',
    },
  };

  return circuits[circuitType] || { name: circuitType, gateCount: 0, provingTime: 'unknown' };
}
