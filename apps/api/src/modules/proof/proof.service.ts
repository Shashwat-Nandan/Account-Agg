import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CircuitType, Prisma, ProofStatus } from '@prisma/client';
import { hashCommitment } from '../../common/hash.util';
import { PROOF_EXPIRY_DAYS } from '../../common/constants';

@Injectable()
export class ProofService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProof(
    userId: string,
    circuitType: CircuitType,
    publicInputs: Record<string, unknown>,
    proofData: string,
  ) {
    const proofHash = hashCommitment(proofData);

    // Check for duplicate proof
    const existing = await this.prisma.proof.findUnique({
      where: { proofHash },
    });
    if (existing) {
      throw new BadRequestException('Duplicate proof submission');
    }

    // Server-side verification would happen here using bb.js
    // For now, mark as verified (in production: actually verify with Barretenberg)
    const verified = await this.verifyProofServerSide(circuitType, proofData, publicInputs);

    const proof = await this.prisma.proof.create({
      data: {
        userId,
        circuitType,
        publicInputs: publicInputs as Prisma.InputJsonValue,
        proofData,
        proofHash,
        status: verified ? ProofStatus.VERIFIED : ProofStatus.INVALID,
        verified,
        verifiedAt: verified ? new Date() : undefined,
        expiresAt: new Date(Date.now() + PROOF_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return {
      id: proof.id,
      circuitType: proof.circuitType,
      publicInputs: proof.publicInputs,
      status: proof.status,
      verified: proof.verified,
      proofHash: proof.proofHash,
      createdAt: proof.createdAt,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.proof.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        circuitType: true,
        publicInputs: true,
        status: true,
        verified: true,
        proofHash: true,
        createdAt: true,
        expiresAt: true,
      },
    });
  }

  async findById(id: string) {
    const proof = await this.prisma.proof.findUnique({ where: { id } });
    if (!proof) throw new NotFoundException('Proof not found');
    return proof;
  }

  /**
   * Public verification endpoint — anyone can verify a proof.
   */
  async verifyPublic(
    circuitType: CircuitType,
    proofData: string,
    publicInputs: Record<string, unknown>,
  ) {
    const verified = await this.verifyProofServerSide(
      circuitType,
      proofData,
      publicInputs,
    );

    return {
      valid: verified,
      circuitType,
      publicInputs,
      verifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Server-side proof verification using Barretenberg (bb.js).
   * In production, this loads the verification key and runs UltraHonk verify.
   */
  private async verifyProofServerSide(
    _circuitType: CircuitType,
    _proofData: string,
    _publicInputs: Record<string, unknown>,
  ): Promise<boolean> {
    // TODO: Integrate bb.js for server-side verification
    // const backend = new UltraHonkBackend(circuit);
    // const isValid = await backend.verifyProof({ proof, publicInputs });
    // return isValid;

    // Placeholder: accept all well-formed proofs in development
    return _proofData.length > 0;
  }
}
