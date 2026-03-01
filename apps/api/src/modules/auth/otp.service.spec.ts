import { Test, TestingModule } from '@nestjs/testing';
import { OtpService } from './otp.service';
import { PrismaService } from '../../database/prisma.service';
import { OTP_EXPIRY_MS, OTP_MAX_ATTEMPTS } from '../../common/constants';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: { otpSession: Record<string, jest.Mock> };

  beforeEach(async () => {
    prisma = {
      otpSession: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'otp-1' }),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  describe('generate', () => {
    it('should invalidate existing OTPs and create a new one', async () => {
      const otp = await service.generate('+919999999999');

      expect(prisma.otpSession.updateMany).toHaveBeenCalledWith({
        where: { phone: '+919999999999', verified: false },
        data: { verified: true },
      });
      expect(prisma.otpSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+919999999999',
          }),
        }),
      );
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should set expiry using OTP_EXPIRY_MS constant', async () => {
      const before = Date.now();
      await service.generate('+919999999999');
      const after = Date.now();

      const createCall = prisma.otpSession.create.mock.calls[0][0];
      const expiresAt = createCall.data.expiresAt.getTime();
      expect(expiresAt).toBeGreaterThanOrEqual(before + OTP_EXPIRY_MS);
      expect(expiresAt).toBeLessThanOrEqual(after + OTP_EXPIRY_MS);
    });
  });

  describe('verify', () => {
    it('should return false if no session found', async () => {
      prisma.otpSession.findFirst.mockResolvedValue(null);
      const result = await service.verify('+919999999999', '123456');
      expect(result).toBe(false);
    });

    it('should return false if max attempts exceeded', async () => {
      prisma.otpSession.findFirst.mockResolvedValue({
        id: 'otp-1',
        attempts: OTP_MAX_ATTEMPTS,
        otpHash: 'hash',
      });
      const result = await service.verify('+919999999999', '123456');
      expect(result).toBe(false);
    });

    it('should return false for wrong OTP', async () => {
      await service.generate('+919999999999');
      const createCall = prisma.otpSession.create.mock.calls[0][0];

      prisma.otpSession.findFirst.mockResolvedValue({
        id: 'otp-1',
        attempts: 0,
        otpHash: createCall.data.otpHash,
      });
      prisma.otpSession.update.mockResolvedValue({});

      const result = await service.verify('+919999999999', '000000');
      expect(result).toBe(false);
    });

    it('should return true and mark as verified for correct OTP', async () => {
      const otp = await service.generate('+919999999999');
      const createCall = prisma.otpSession.create.mock.calls[0][0];

      prisma.otpSession.findFirst.mockResolvedValue({
        id: 'otp-1',
        attempts: 0,
        otpHash: createCall.data.otpHash,
      });
      prisma.otpSession.update.mockResolvedValue({});

      const result = await service.verify('+919999999999', otp);
      expect(result).toBe(true);
      expect(prisma.otpSession.update).toHaveBeenCalledWith({
        where: { id: 'otp-1' },
        data: { verified: true },
      });
    });
  });
});
