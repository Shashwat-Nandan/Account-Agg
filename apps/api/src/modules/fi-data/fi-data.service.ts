import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MinioService } from './minio.service';
import { encryptAES256GCM, decryptAES256GCM } from '@account-agg/shared';
import { createHash } from 'node:crypto';

@Injectable()
export class FiDataService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly minio: MinioService,
  ) {
    this.encryptionKey =
      this.config.get<string>('ENCRYPTION_MASTER_KEY') ||
      'a'.repeat(64); // 32 bytes hex - dev fallback
  }

  async createDataSession(consentId: string, userId: string) {
    const consent = await this.prisma.consent.findFirst({
      where: { id: consentId, userId, status: 'ACTIVE' },
    });
    if (!consent) {
      throw new NotFoundException('Active consent not found');
    }

    const session = await this.prisma.dataSession.create({
      data: {
        consentId,
        userId,
        setuSessionId: `sim_session_${Date.now()}`,
      },
    });

    // In production: call Setu to create FI data session
    // then poll/wait for webhook notification

    return session;
  }

  async processAndStoreFIData(
    sessionId: string,
    rawFiData: string,
  ) {
    const session = await this.prisma.dataSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Data session not found');

    // Compute data hash (Poseidon in production, SHA-256 placeholder)
    const dataHash = this.computeDataHash(rawFiData);

    // Encrypt and store in MinIO
    const encrypted = encryptAES256GCM(rawFiData, this.encryptionKey);
    const blobKey = `fi-data/${session.userId}/${sessionId}.enc`;

    await this.minio.putObject(
      'fi-data',
      blobKey,
      JSON.stringify(encrypted),
    );

    // Update session with blob reference and hash
    return this.prisma.dataSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        fiDataRef: blobKey,
        dataHash,
        fetchedAt: new Date(),
      },
    });
  }

  async getFIData(sessionId: string, userId: string) {
    const session = await this.prisma.dataSession.findFirst({
      where: { id: sessionId, userId, status: 'COMPLETED' },
    });
    if (!session || !session.fiDataRef) {
      throw new NotFoundException('FI data not found');
    }

    // Fetch encrypted blob from MinIO
    const encryptedStr = await this.minio.getObject('fi-data', session.fiDataRef);
    const encrypted = JSON.parse(encryptedStr);

    // Decrypt
    const rawData = decryptAES256GCM(encrypted, this.encryptionKey);

    return {
      sessionId: session.id,
      consentId: session.consentId,
      dataHash: session.dataHash,
      data: JSON.parse(rawData),
      fetchedAt: session.fetchedAt,
    };
  }

  async getSessionsByUser(userId: string) {
    return this.prisma.dataSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        consent: {
          select: { vua: true, fiTypes: true, purpose: true },
        },
      },
    });
  }

  async handleFINotification(sessionId: string, status: string) {
    return this.prisma.dataSession.updateMany({
      where: { setuSessionId: sessionId },
      data: { status: status as any },
    });
  }

  /**
   * Compute data commitment hash.
   * In production, this would use Poseidon hash for ZK compatibility.
   * Using SHA-256 as placeholder until Poseidon library is integrated.
   */
  private computeDataHash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
