import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { PrismaService } from '../../database/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: Record<string, jest.Mock> };
  let otpService: { generate: jest.Mock; verify: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const mockUser = {
    id: 'user-1',
    phone: '+919999999999',
    email: null,
    kycStatus: 'NOT_STARTED',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    otpService = {
      generate: jest.fn().mockResolvedValue('123456'),
      verify: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: OtpService, useValue: otpService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestOtp', () => {
    it('should generate and return OTP in non-production', async () => {
      const result = await service.requestOtp('+919999999999');
      expect(otpService.generate).toHaveBeenCalledWith('+919999999999');
      expect(result.message).toBe('OTP sent successfully');
      expect(result.phone).toBe('+919999999999');
    });
  });

  describe('verifyOtp', () => {
    it('should throw UnauthorizedException for invalid OTP', async () => {
      otpService.verify.mockResolvedValue(false);
      await expect(
        service.verifyOtp('+919999999999', '000000'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create user if not found and return JWT', async () => {
      otpService.verify.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.verifyOtp('+919999999999', '123456');

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { phone: '+919999999999' },
      });
      expect(result.accessToken).toBe('jwt-token');
      expect(result.user.id).toBe('user-1');
    });

    it('should use existing user if found', async () => {
      otpService.verify.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.verifyOtp('+919999999999', '123456');

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(result.accessToken).toBe('jwt-token');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.getProfile('user-1');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update and return user', async () => {
      const updated = { ...mockUser, email: 'test@test.com' };
      prisma.user.update.mockResolvedValue(updated);

      const result = await service.updateProfile('user-1', {
        email: 'test@test.com',
      });
      expect(result.email).toBe('test@test.com');
    });
  });
});
