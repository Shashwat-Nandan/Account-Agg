import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { randomBytes } from 'node:crypto';
import {
  DEFAULT_SHARE_EXPIRY_HOURS,
  DEFAULT_MAX_SHARE_ACCESS,
} from '../../common/constants';

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  async createShare(
    userId: string,
    proofId: string,
    recipientId: string,
    purpose: string,
    expiresInHours: number = DEFAULT_SHARE_EXPIRY_HOURS,
    maxAccess: number = DEFAULT_MAX_SHARE_ACCESS,
  ) {
    // Verify proof belongs to user and is verified
    const proof = await this.prisma.proof.findFirst({
      where: { id: proofId, userId, verified: true },
    });
    if (!proof) {
      throw new NotFoundException('Verified proof not found');
    }

    const shareToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const share = await this.prisma.proofShare.create({
      data: {
        userId,
        proofId,
        recipientId,
        purpose,
        shareToken,
        expiresAt,
        maxAccess,
      },
    });

    return {
      id: share.id,
      shareToken: share.shareToken,
      shareUrl: `/api/share/${share.shareToken}`,
      expiresAt: share.expiresAt,
      maxAccess: share.maxAccess,
    };
  }

  /**
   * Third-party retrieval endpoint.
   * Returns proof metadata + public inputs only. NEVER raw FI data.
   */
  async getSharedProof(shareToken: string) {
    const share = await this.prisma.proofShare.findUnique({
      where: { shareToken },
      include: {
        proof: {
          select: {
            circuitType: true,
            publicInputs: true,
            status: true,
            verified: true,
            proofHash: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!share) throw new NotFoundException('Share not found');
    if (share.revokedAt) throw new ForbiddenException('Share has been revoked');
    if (share.expiresAt < new Date()) throw new ForbiddenException('Share has expired');
    if (share.accessCount >= share.maxAccess) {
      throw new ForbiddenException('Maximum access count reached');
    }

    // Increment access count
    await this.prisma.proofShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 } },
    });

    return {
      purpose: share.purpose,
      proof: share.proof,
      accessedAt: new Date().toISOString(),
      remainingAccess: share.maxAccess - share.accessCount - 1,
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.proofShare.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        proof: {
          select: { circuitType: true, publicInputs: true, verified: true },
        },
      },
    });
  }

  async revoke(id: string, userId: string) {
    const share = await this.prisma.proofShare.findFirst({
      where: { id, userId },
    });
    if (!share) throw new NotFoundException('Share not found');
    if (share.revokedAt) {
      throw new BadRequestException('Share already revoked');
    }

    return this.prisma.proofShare.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
