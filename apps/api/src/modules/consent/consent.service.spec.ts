import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsentService } from './consent.service';
import { PrismaService } from '../../database/prisma.service';
import { ConsentStatus } from '@prisma/client';

describe('ConsentService', () => {
  let service: ConsentService;
  let prisma: { consent: Record<string, jest.Mock> };

  const mockConsent = {
    id: 'consent-1',
    userId: 'user-1',
    vua: 'user@fi',
    fiTypes: ['DEPOSIT'],
    purpose: 'Loan application',
    status: ConsentStatus.PENDING,
    setuConsentId: null,
    consentHandle: null,
    approvalUrl: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      consent: {
        create: jest.fn().mockResolvedValue(mockConsent),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsentService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ConsentService>(ConsentService);
  });

  describe('create', () => {
    it('should create a consent with approval URL', async () => {
      const updated = {
        ...mockConsent,
        setuConsentId: 'sim_consent_consent-1',
        approvalUrl: expect.any(String),
      };
      prisma.consent.update.mockResolvedValue(updated);

      const result = await service.create({
        userId: 'user-1',
        vua: 'user@fi',
        fiTypes: ['DEPOSIT'],
        purpose: 'Loan application',
        dataRangeFrom: new Date(),
        dataRangeTo: new Date(),
      });

      expect(prisma.consent.create).toHaveBeenCalled();
      expect(prisma.consent.update).toHaveBeenCalled();
      expect(result.setuConsentId).toContain('sim_consent_');
    });
  });

  describe('findAllByUser', () => {
    it('should return all consents for user', async () => {
      prisma.consent.findMany.mockResolvedValue([mockConsent]);
      const result = await service.findAllByUser('user-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return consent by id', async () => {
      prisma.consent.findFirst.mockResolvedValue(mockConsent);
      const result = await service.findById('consent-1', 'user-1');
      expect(result.id).toBe('consent-1');
    });

    it('should throw NotFoundException if not found', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);
      await expect(
        service.findById('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleConsentNotification', () => {
    it('should update consent status', async () => {
      prisma.consent.findFirst.mockResolvedValue(mockConsent);
      prisma.consent.update.mockResolvedValue({
        ...mockConsent,
        status: ConsentStatus.ACTIVE,
      });

      const result = await service.handleConsentNotification(
        'setu-id',
        'handle-1',
        ConsentStatus.ACTIVE,
      );
      expect(result.status).toBe(ConsentStatus.ACTIVE);
    });

    it('should throw NotFoundException if consent not found', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);
      await expect(
        service.handleConsentNotification(
          'nonexistent',
          'handle',
          ConsentStatus.ACTIVE,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('revoke', () => {
    it('should revoke an active consent', async () => {
      prisma.consent.findFirst.mockResolvedValue({
        ...mockConsent,
        status: ConsentStatus.ACTIVE,
      });
      prisma.consent.update.mockResolvedValue({
        ...mockConsent,
        status: ConsentStatus.REVOKED,
      });

      const result = await service.revoke('consent-1', 'user-1');
      expect(result.status).toBe(ConsentStatus.REVOKED);
    });

    it('should throw if already revoked', async () => {
      prisma.consent.findFirst.mockResolvedValue({
        ...mockConsent,
        status: 'REVOKED',
      });

      await expect(
        service.revoke('consent-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
