import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FiDataService } from './fi-data.service';
import { PrismaService } from '../../database/prisma.service';
import { MinioService } from './minio.service';
import { DataSessionStatus } from '@prisma/client';

// Mock the encryption module
jest.mock('@account-agg/shared/dist/utils/encryption', () => ({
  encryptAES256GCM: jest.fn().mockReturnValue({
    ciphertext: 'encrypted',
    iv: 'iv',
    tag: 'tag',
  }),
  decryptAES256GCM: jest.fn().mockReturnValue('{"balance": 100000}'),
}));

describe('FiDataService', () => {
  let service: FiDataService;
  let prisma: {
    consent: Record<string, jest.Mock>;
    dataSession: Record<string, jest.Mock>;
  };
  let minio: { putObject: jest.Mock; getObject: jest.Mock };

  const mockSession = {
    id: 'session-1',
    consentId: 'consent-1',
    userId: 'user-1',
    setuSessionId: 'setu-1',
    status: DataSessionStatus.PENDING,
    fiDataRef: null,
    dataHash: null,
    fetchedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      consent: {
        findFirst: jest.fn(),
      },
      dataSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    minio = {
      putObject: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn().mockResolvedValue(
        JSON.stringify({ ciphertext: 'encrypted', iv: 'iv', tag: 'tag' }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiDataService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'ENCRYPTION_MASTER_KEY') return 'a'.repeat(64);
              return undefined;
            }),
          },
        },
        { provide: MinioService, useValue: minio },
      ],
    }).compile();

    service = module.get<FiDataService>(FiDataService);
  });

  describe('createDataSession', () => {
    it('should create session for active consent', async () => {
      prisma.consent.findFirst.mockResolvedValue({
        id: 'consent-1',
        status: 'ACTIVE',
      });
      prisma.dataSession.create.mockResolvedValue(mockSession);

      const result = await service.createDataSession('consent-1', 'user-1');
      expect(result.id).toBe('session-1');
      expect(prisma.consent.findFirst).toHaveBeenCalledWith({
        where: { id: 'consent-1', userId: 'user-1', status: 'ACTIVE' },
      });
    });

    it('should throw NotFoundException if consent not found', async () => {
      prisma.consent.findFirst.mockResolvedValue(null);

      await expect(
        service.createDataSession('consent-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('processAndStoreFIData', () => {
    it('should encrypt, store, and update session', async () => {
      prisma.dataSession.findUnique.mockResolvedValue(mockSession);
      prisma.dataSession.update.mockResolvedValue({
        ...mockSession,
        status: 'COMPLETED',
        fiDataRef: 'fi-data/user-1/session-1.enc',
      });

      await service.processAndStoreFIData(
        'session-1',
        '{"balance": 100000}',
      );

      expect(minio.putObject).toHaveBeenCalledWith(
        'fi-data',
        expect.stringContaining('fi-data/'),
        expect.any(String),
      );
      expect(prisma.dataSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'COMPLETED' }),
        }),
      );
    });

    it('should throw NotFoundException if session not found', async () => {
      prisma.dataSession.findUnique.mockResolvedValue(null);

      await expect(
        service.processAndStoreFIData('session-1', 'data'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFIData', () => {
    it('should fetch and decrypt FI data', async () => {
      prisma.dataSession.findFirst.mockResolvedValue({
        ...mockSession,
        status: 'COMPLETED',
        fiDataRef: 'fi-data/user-1/session-1.enc',
        dataHash: 'hash',
        fetchedAt: new Date(),
      });

      const result = await service.getFIData('session-1', 'user-1');

      expect(result.sessionId).toBe('session-1');
      expect(result.data).toEqual({ balance: 100000 });
    });

    it('should throw NotFoundException if session not found', async () => {
      prisma.dataSession.findFirst.mockResolvedValue(null);

      await expect(
        service.getFIData('session-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('handleFINotification', () => {
    it('should update session status', async () => {
      prisma.dataSession.updateMany.mockResolvedValue({ count: 1 });

      await service.handleFINotification(
        'setu-1',
        DataSessionStatus.COMPLETED,
      );

      expect(prisma.dataSession.updateMany).toHaveBeenCalledWith({
        where: { setuSessionId: 'setu-1' },
        data: { status: DataSessionStatus.COMPLETED },
      });
    });
  });
});
