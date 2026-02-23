import { CircuitType } from '@account-agg/shared';
import { loadCircuit, type CompiledCircuit } from './circuit-loader';

export type ProofGenerationStatus =
  | 'idle'
  | 'loading-circuit'
  | 'initializing-backend'
  | 'generating-witness'
  | 'generating-proof'
  | 'done'
  | 'error';

export interface GeneratedProof {
  proof: Uint8Array;
  publicInputs: string[];
  provingTimeMs: number;
}

export interface ProofProgressCallback {
  (status: ProofGenerationStatus, detail?: string): void;
}

/**
 * Client-side ZK proof generation using NoirJS + Barretenberg WASM.
 *
 * All private witness data (balances, income, KYC fields) stays in the browser.
 * Only the proof + public inputs are sent to the server.
 */
export class NoirClient {
  private noir: any = null;
  private backend: any = null;
  private circuit: CompiledCircuit | null = null;

  /**
   * Generate a ZK proof entirely in the browser.
   *
   * @param circuitType - Which circuit to use
   * @param inputs - All inputs (private + public) for the circuit
   * @param onProgress - Optional progress callback
   * @returns Generated proof with public inputs
   */
  async generateProof(
    circuitType: CircuitType,
    inputs: Record<string, unknown>,
    onProgress?: ProofProgressCallback,
  ): Promise<GeneratedProof> {
    const startTime = Date.now();

    try {
      // Step 1: Load compiled circuit
      onProgress?.('loading-circuit', `Loading ${circuitType} circuit...`);
      this.circuit = await loadCircuit(circuitType);

      // Step 2: Initialize NoirJS and Barretenberg backend
      onProgress?.('initializing-backend', 'Initializing WASM proving backend...');

      // Dynamic imports for browser WASM modules
      const [{ Noir }, { UltraHonkBackend }] = await Promise.all([
        import('@noir-lang/noir_js'),
        import('@aztec/bb.js').then((m) => ({
          UltraHonkBackend: m.UltraHonkBackend || m.BarretenbergBackend,
        })),
      ]);

      this.backend = new UltraHonkBackend(this.circuit.bytecode);
      this.noir = new Noir(this.circuit);

      // Step 3: Generate witness from inputs
      onProgress?.('generating-witness', 'Computing witness from your data...');
      const { witness } = await this.noir.execute(inputs);

      // Step 4: Generate proof
      onProgress?.(
        'generating-proof',
        'Generating ZK proof (this may take 5-30 seconds)...',
      );
      const proof = await this.backend.generateProof(witness);

      onProgress?.('done', 'Proof generated successfully!');

      return {
        proof: proof.proof,
        publicInputs: proof.publicInputs,
        provingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      onProgress?.('error', (error as Error).message);
      throw error;
    }
  }

  /**
   * Verify a proof locally (optional — server also verifies).
   */
  async verifyProof(proof: Uint8Array, publicInputs: string[]): Promise<boolean> {
    if (!this.backend) {
      throw new Error('Backend not initialized. Generate a proof first.');
    }
    return this.backend.verifyProof({ proof, publicInputs });
  }

  /**
   * Clean up WASM resources.
   */
  async destroy() {
    if (this.backend) {
      await this.backend.destroy?.();
      this.backend = null;
    }
    this.noir = null;
    this.circuit = null;
  }
}

/**
 * Singleton NoirClient instance for the application.
 */
let clientInstance: NoirClient | null = null;

export function getNoirClient(): NoirClient {
  if (!clientInstance) {
    clientInstance = new NoirClient();
  }
  return clientInstance;
}
