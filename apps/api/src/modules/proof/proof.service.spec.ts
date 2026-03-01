import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProofService } from './proof.service';
import { PrismaService } from '../../database/prisma.service';
import { CircuitType, ProofStatus } from '@prisma/client';

describe('ProofService', () => {
  let service: ProofService;
  let prisma: { proof: Record<string, jest.Mock> };

  const mockProof = {
    id: 'proof-1',
    userId: 'user-1',
    circuitType: CircuitType.INCOME_RANGE,
    publicInputs: { minIncome: 500000 },
    proofData: 'base64proof',
    proofHash: 'hash123',
    status: ProofStatus.VERIFIED,
    verified: true,
    verifiedAt: new Date(),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  };

  beforeEach(async () => {
    prisma = {
      proof: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProofService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProofService>(ProofService);
  });

  describe('submitProof', () => {
    it('should create a verified proof', async () => {
      prisma.proof.findUnique.mockResolvedValue(null);
      prisma.proof.create.mockResolvedValue(mockProof);

      const result = await service.submitProof(
        'user-1',
        CircuitType.INCOME_RANGE,
        { minIncome: 500000 },
        'base64proof',
      );

      expect(result.id).toBe('proof-1');
      expect(result.verified).toBe(true);
      expect(prisma.proof.create).toHaveBeenCalled();
    });

    it('should reject duplicate proofs', async () => {
      prisma.proof.findUnique.mockResolvedValue(mockProof);

      await expect(
        service.submitProof(
          'user-1',
          CircuitType.INCOME_RANGE,
          { minIncome: 500000 },
          'base64proof',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllByUser', () => {
    it('should return all proofs for a user', async () => {
      prisma.proof.findMany.mockResolvedValue([mockProof]);
      const result = await service.findAllByUser('user-1');
      expect(result).toHaveLength(1);
      expect(prisma.proof.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return a proof by id', async () => {
      prisma.proof.findUnique.mockResolvedValue(mockProof);
      const result = await service.findById('proof-1');
      expect(result.id).toBe('proof-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.proof.findUnique.mockResolvedValue(null);
      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('verifyPublic', () => {
    it('should verify a well-formed proof', async () => {
      const result = await service.verifyPublic(
        CircuitType.INCOME_RANGE,
        'base64proof',
        { minIncome: 500000 },
      );
      expect(result.valid).toBe(true);
      expect(result.circuitType).toBe(CircuitType.INCOME_RANGE);
    });
  });
});
