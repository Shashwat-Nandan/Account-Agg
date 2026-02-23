import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { ConsentStatus } from '@prisma/client';

export interface CreateConsentParams {
  userId: string;
  vua: string;
  fiTypes: string[];
  purpose: string;
  purposeCode?: string;
  dataRangeFrom: Date;
  dataRangeTo: Date;
  consentDurationDays?: number;
  fetchType?: string;
  consentMode?: string;
}

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(params: CreateConsentParams) {
    const durationDays = params.consentDurationDays || 365;
    const consentExpiry = new Date();
    consentExpiry.setDate(consentExpiry.getDate() + durationDays);

    // Create local consent record
    const consent = await this.prisma.consent.create({
      data: {
        userId: params.userId,
        vua: params.vua,
        fiTypes: params.fiTypes,
        purpose: params.purpose,
        purposeCode: params.purposeCode,
        dataRangeFrom: params.dataRangeFrom,
        dataRangeTo: params.dataRangeTo,
        consentExpiry,
        fetchType: params.fetchType || 'ONETIME',
        consentMode: params.consentMode || 'VIEW',
      },
    });

    // In production: call Setu AA to create consent and get approvalUrl
    // For now, simulate with sandbox behavior
    const setuConsentId = `sim_consent_${consent.id}`;
    const approvalUrl = `https://anumati-sandbox.setu.co/consent/${setuConsentId}`;

    const updated = await this.prisma.consent.update({
      where: { id: consent.id },
      data: { setuConsentId, approvalUrl },
    });

    return updated;
  }

  async findAllByUser(userId: string) {
    return this.prisma.consent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        dataSessions: {
          select: { id: true, status: true, fetchedAt: true },
        },
      },
    });
  }

  async findById(id: string, userId: string) {
    const consent = await this.prisma.consent.findFirst({
      where: { id, userId },
      include: {
        dataSessions: true,
      },
    });
    if (!consent) throw new NotFoundException('Consent not found');
    return consent;
  }

  async handleConsentNotification(
    consentId: string,
    consentHandle: string,
    status: ConsentStatus,
  ) {
    const consent = await this.prisma.consent.findFirst({
      where: {
        OR: [
          { setuConsentId: consentId },
          { consentHandle: consentHandle },
        ],
      },
    });

    if (!consent) {
      throw new NotFoundException(`Consent not found: ${consentId}`);
    }

    return this.prisma.consent.update({
      where: { id: consent.id },
      data: {
        status,
        consentHandle: consentHandle || consent.consentHandle,
      },
    });
  }

  async revoke(id: string, userId: string) {
    const consent = await this.findById(id, userId);
    if (consent.status === 'REVOKED') {
      throw new BadRequestException('Consent already revoked');
    }

    // In production: call Setu AA to revoke consent
    return this.prisma.consent.update({
      where: { id },
      data: { status: ConsentStatus.REVOKED },
    });
  }
}
