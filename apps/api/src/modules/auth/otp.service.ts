import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomInt, createHash } from 'node:crypto';

@Injectable()
export class OtpService {
  private readonly OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ATTEMPTS = 5;

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
        expiresAt: new Date(Date.now() + this.OTP_EXPIRY_MS),
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
    if (session.attempts >= this.MAX_ATTEMPTS) return false;

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
    return createHash('sha256').update(value).digest('hex');
  }
}
