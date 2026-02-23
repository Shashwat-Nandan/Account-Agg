import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { OtpService } from './otp.service';

export interface JwtPayload {
  sub: string;
  phone: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otpService: OtpService,
  ) {}

  async requestOtp(phone: string) {
    const otp = await this.otpService.generate(phone);
    // In production, send OTP via SMS gateway
    // For sandbox/dev, return it in response
    return {
      message: 'OTP sent successfully',
      phone,
      // Remove in production — only for sandbox testing
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    };
  }

  async verifyOtp(phone: string, otp: string) {
    const valid = await this.otpService.verify(phone, otp);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone } });
    }

    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    const accessToken = this.jwt.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        kycStatus: user.kycStatus,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        kycStatus: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { email?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        email: true,
        kycStatus: true,
      },
    });
  }
}
