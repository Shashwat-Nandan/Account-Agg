declare module '@noir-lang/noir_js' {
  export class Noir {
    constructor(circuit: any);
    execute(inputs: Record<string, unknown>): Promise<{ witness: any }>;
  }
}

declare module '@aztec/bb.js' {
  export class UltraHonkBackend {
    constructor(bytecode: string);
    generateProof(witness: any): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
    verifyProof(args: { proof: Uint8Array; publicInputs: string[] }): Promise<boolean>;
    destroy(): Promise<void>;
  }
  export class BarretenbergBackend {
    constructor(bytecode: string);
    generateProof(witness: any): Promise<{ proof: Uint8Array; publicInputs: string[] }>;
    verifyProof(args: { proof: Uint8Array; publicInputs: string[] }): Promise<boolean>;
    destroy(): Promise<void>;
  }
}
