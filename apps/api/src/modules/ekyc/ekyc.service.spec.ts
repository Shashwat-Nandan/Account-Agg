import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EkycService } from './ekyc.service';
import { PrismaService } from '../../database/prisma.service';
import { KycProvider, KycStatus } from '@prisma/client';

describe('EkycService', () => {
  let service: EkycService;
  let prisma: {
    kycRecord: Record<string, jest.Mock>;
    user: Record<string, jest.Mock>;
  };

  const mockKycRecord = {
    id: 'kyc-1',
    userId: 'user-1',
    provider: KycProvider.AADHAAR,
    status: KycStatus.IN_PROGRESS,
    providerLevel: 3,
    nameHash: null,
    dobHash: null,
    panHash: null,
    attestationHash: null,
    verifiedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      kycRecord: {
        findFirst: jest.fn(),
        create: jest.fn().mockResolvedValue(mockKycRecord),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EkycService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EkycService>(EkycService);
  });

  describe('initiateAadhaarKyc', () => {
    it('should create KYC record and return OTP status', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(null);

      const result = await service.initiateAadhaarKyc('user-1');

      expect(result.provider).toBe('AADHAAR');
      expect(result.status).toBe('OTP_REQUESTED');
      expect(prisma.kycRecord.create).toHaveBeenCalled();
    });

    it('should update existing record', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(mockKycRecord);
      prisma.kycRecord.update.mockResolvedValue(mockKycRecord);

      const result = await service.initiateAadhaarKyc('user-1');
      expect(result.provider).toBe('AADHAAR');
      expect(prisma.kycRecord.update).toHaveBeenCalled();
    });
  });

  describe('verifyAadhaarOtp', () => {
    it('should verify OTP and store hashes', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(mockKycRecord);
      const verifiedRecord = {
        ...mockKycRecord,
        status: KycStatus.VERIFIED,
        attestationHash: 'hash',
        verifiedAt: new Date(),
      };
      prisma.kycRecord.update.mockResolvedValue(verifiedRecord);

      const result = await service.verifyAadhaarOtp(
        'user-1',
        'txn-1',
        '123456',
      );

      expect(result.status).toBe(KycStatus.VERIFIED);
      expect(result.attestationHash).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { kycStatus: KycStatus.VERIFIED },
      });
    });

    it('should throw NotFoundException if no KYC record', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyAadhaarOtp('user-1', 'txn-1', '123456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('initiatePanVerification', () => {
    it('should verify PAN and store attestation', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(null);
      const verifiedRecord = {
        ...mockKycRecord,
        provider: KycProvider.PAN,
        status: KycStatus.VERIFIED,
        attestationHash: 'hash',
      };
      prisma.kycRecord.update.mockResolvedValue(verifiedRecord);

      const result = await service.initiatePanVerification(
        'user-1',
        'ABCDE1234F',
        'Test User',
      );

      expect(result.status).toBe(KycStatus.VERIFIED);
      expect(result.attestationHash).toBeDefined();
    });
  });

  describe('getKycStatus', () => {
    it('should return overall status and providers', async () => {
      prisma.kycRecord.findMany.mockResolvedValue([mockKycRecord]);
      prisma.user.findUnique.mockResolvedValue({
        kycStatus: KycStatus.VERIFIED,
      });

      const result = await service.getKycStatus('user-1');

      expect(result.overallStatus).toBe(KycStatus.VERIFIED);
      expect(result.providers).toHaveLength(1);
    });
  });

  describe('getAttestationForProof', () => {
    it('should return attestation data for verified KYC', async () => {
      const verifiedRecord = {
        ...mockKycRecord,
        status: KycStatus.VERIFIED,
        nameHash: 'name-hash',
        dobHash: 'dob-hash',
        panHash: 'pan-hash',
        attestationHash: 'attestation-hash',
        verifiedAt: new Date(),
      };
      prisma.kycRecord.findFirst.mockResolvedValue(verifiedRecord);

      const result = await service.getAttestationForProof(
        'user-1',
        KycProvider.AADHAAR,
      );

      expect(result.nameHash).toBe('name-hash');
      expect(result.attestationHash).toBe('attestation-hash');
    });

    it('should throw NotFoundException if no verified KYC', async () => {
      prisma.kycRecord.findFirst.mockResolvedValue(null);

      await expect(
        service.getAttestationForProof('user-1', KycProvider.AADHAAR),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
