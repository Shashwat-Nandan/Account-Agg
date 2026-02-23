'use client';

import { create } from 'zustand';
import { CircuitType } from '@account-agg/shared';
import type { ProofGenerationStatus } from './noir-client';

interface ProofRecord {
  id: string;
  circuitType: CircuitType;
  publicInputs: Record<string, unknown>;
  proofHash: string;
  verified: boolean;
  createdAt: string;
}

interface ProofState {
  proofs: ProofRecord[];
  generationStatus: ProofGenerationStatus;
  generationDetail: string;
  currentCircuit: CircuitType | null;

  setProofs: (proofs: ProofRecord[]) => void;
  addProof: (proof: ProofRecord) => void;
  setGenerationStatus: (status: ProofGenerationStatus, detail?: string) => void;
  setCurrentCircuit: (circuit: CircuitType | null) => void;
  reset: () => void;
}

export const useProofStore = create<ProofState>()((set) => ({
  proofs: [],
  generationStatus: 'idle',
  generationDetail: '',
  currentCircuit: null,

  setProofs: (proofs) => set({ proofs }),
  addProof: (proof) =>
    set((state) => ({ proofs: [proof, ...state.proofs] })),
  setGenerationStatus: (generationStatus, generationDetail = '') =>
    set({ generationStatus, generationDetail }),
  setCurrentCircuit: (currentCircuit) => set({ currentCircuit }),
  reset: () =>
    set({
      generationStatus: 'idle',
      generationDetail: '',
      currentCircuit: null,
    }),
}));
