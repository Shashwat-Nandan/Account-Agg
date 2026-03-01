import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SharingService } from './sharing.service';
import { PrismaService } from '../../database/prisma.service';
import { CircuitType } from '@prisma/client';

describe('SharingService', () => {
  let service: SharingService;
  let prisma: {
    proof: Record<string, jest.Mock>;
    proofShare: Record<string, jest.Mock>;
  };

  const mockProof = {
    id: 'proof-1',
    userId: 'user-1',
    circuitType: CircuitType.INCOME_RANGE,
    publicInputs: { minIncome: 500000 },
    verified: true,
  };

  const mockShare = {
    id: 'share-1',
    userId: 'user-1',
    proofId: 'proof-1',
    recipientId: 'recipient-1',
    purpose: 'Loan application',
    shareToken: 'token123',
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
    maxAccess: 10,
    accessCount: 0,
    revokedAt: null,
    proof: {
      circuitType: CircuitType.INCOME_RANGE,
      publicInputs: { minIncome: 500000 },
      status: 'VERIFIED',
      verified: true,
      proofHash: 'hash123',
      verifiedAt: new Date(),
    },
  };

  beforeEach(async () => {
    prisma = {
      proof: {
        findFirst: jest.fn(),
      },
      proofShare: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SharingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  describe('createShare', () => {
    it('should create a share with token and URL', async () => {
      prisma.proof.findFirst.mockResolvedValue(mockProof);
      prisma.proofShare.create.mockResolvedValue(mockShare);

      const result = await service.createShare(
        'user-1',
        'proof-1',
        'recipient-1',
        'Loan application',
      );

      expect(result.shareToken).toBeDefined();
      expect(result.shareUrl).toContain('/api/share/');
    });

    it('should throw NotFoundException if proof not found', async () => {
      prisma.proof.findFirst.mockResolvedValue(null);

      await expect(
        service.createShare('user-1', 'proof-1', 'recipient-1', 'test'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSharedProof', () => {
    it('should return proof data and increment access count', async () => {
      prisma.proofShare.findUnique.mockResolvedValue(mockShare);
      prisma.proofShare.update.mockResolvedValue({});

      const result = await service.getSharedProof('token123');

      expect(result.proof).toBeDefined();
      expect(result.remainingAccess).toBe(9);
      expect(prisma.proofShare.update).toHaveBeenCalledWith({
        where: { id: 'share-1' },
        data: { accessCount: { increment: 1 } },
      });
    });

    it('should throw NotFoundException for unknown token', async () => {
      prisma.proofShare.findUnique.mockResolvedValue(null);
      await expect(
        service.getSharedProof('unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for revoked share', async () => {
      prisma.proofShare.findUnique.mockResolvedValue({
        ...mockShare,
        revokedAt: new Date(),
      });
      await expect(
        service.getSharedProof('token123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for expired share', async () => {
      prisma.proofShare.findUnique.mockResolvedValue({
        ...mockShare,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(
        service.getSharedProof('token123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when max access reached', async () => {
      prisma.proofShare.findUnique.mockResolvedValue({
        ...mockShare,
        accessCount: 10,
      });
      await expect(
        service.getSharedProof('token123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revoke', () => {
    it('should revoke a share', async () => {
      prisma.proofShare.findFirst.mockResolvedValue(mockShare);
      prisma.proofShare.update.mockResolvedValue({
        ...mockShare,
        revokedAt: new Date(),
      });

      const result = await service.revoke('share-1', 'user-1');
      expect(result.revokedAt).toBeDefined();
    });

    it('should throw NotFoundException if share not found', async () => {
      prisma.proofShare.findFirst.mockResolvedValue(null);
      await expect(
        service.revoke('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if already revoked', async () => {
      prisma.proofShare.findFirst.mockResolvedValue({
        ...mockShare,
        revokedAt: new Date(),
      });
      await expect(
        service.revoke('share-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
