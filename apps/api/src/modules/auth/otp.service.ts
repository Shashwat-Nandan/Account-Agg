import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomInt } from 'node:crypto';
import { hashCommitment } from '../../common/hash.util';
import {
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
} from '../../common/constants';

@Injectable()
export class OtpService {

  constructor(private readonly prisma: PrismaService) {}

  async generate(phone: string): Promise<string> {
    // Invalidate any existing OTPs for this phone
    await this.prisma.otpSession.updateMany({
      where: { phone, verified: false },
      data: { verified: true },
    });

    const otp = randomInt(100000, 999999).toString();
    const otpHash = this.hash(otp);

    await this.prisma.otpSession.create({
      data: {
        phone,
        otpHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      },
    });

    return otp;
  }

  async verify(phone: string, otp: string): Promise<boolean> {
    const session = await this.prisma.otpSession.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) return false;
    if (session.attempts >= OTP_MAX_ATTEMPTS) return false;

    // Increment attempts
    await this.prisma.otpSession.update({
      where: { id: session.id },
      data: { attempts: { increment: 1 } },
    });

    const otpHash = this.hash(otp);
    if (otpHash !== session.otpHash) return false;

    // Mark as verified
    await this.prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    return true;
  }

  private hash(value: string): string {
    return hashCommitment(value);
  }
}
