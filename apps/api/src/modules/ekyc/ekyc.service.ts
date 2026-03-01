import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { KycProvider, KycStatus } from '@prisma/client';
import { hashCommitment } from '../../common/hash.util';

interface KycFieldHashes {
  nameHash: string;
  dobHash: string;
  panHash: string;
}

@Injectable()
export class EkycService {
  constructor(private readonly prisma: PrismaService) {}

  async initiateAadhaarKyc(userId: string) {
    const record = await this.getOrCreateRecord(userId, KycProvider.AADHAAR, 3);

    // In production: call AadhaarAdapter.requestOtp()
    return {
      kycRecordId: record.id,
      provider: 'AADHAAR',
      status: 'OTP_REQUESTED',
      message: 'OTP sent to Aadhaar-linked mobile',
    };
  }

  async verifyAadhaarOtp(userId: string, transactionId: string, otp: string) {
    const record = await this.prisma.kycRecord.findFirst({
      where: { userId, provider: KycProvider.AADHAAR },
    });
    if (!record) throw new NotFoundException('KYC record not found');

    // In production: call AadhaarAdapter.verifyOtp()
    // Simulated verified data for sandbox
    const verifiedData = {
      name: 'Sandbox User',
      dob: '1990-01-01',
      gender: 'M',
      address: { state: 'Karnataka', pincode: '560001' },
    };

    // Compute Pedersen hashes (using SHA-256 placeholder)
    const fieldHashes = this.computeFieldHashes(
      verifiedData.name,
      verifiedData.dob,
      '', // PAN from Aadhaar not available
    );

    // Compute attestation hash
    const attestationHash = this.computeAttestationHash(
      fieldHashes,
      KycProvider.AADHAAR,
      Date.now(),
    );

    // Store hashes, DELETE raw data
    const updated = await this.prisma.kycRecord.update({
      where: { id: record.id },
      data: {
        status: KycStatus.VERIFIED,
        nameHash: fieldHashes.nameHash,
        dobHash: fieldHashes.dobHash,
        panHash: fieldHashes.panHash,
        attestationHash,
        verifiedAt: new Date(),
      },
    });

    // Update user KYC status
    await this.prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KycStatus.VERIFIED },
    });

    // Raw eKYC data (verifiedData) is NOT stored — only hashes
    return {
      id: updated.id,
      provider: updated.provider,
      status: updated.status,
      providerLevel: updated.providerLevel,
      attestationHash: updated.attestationHash,
      verifiedAt: updated.verifiedAt,
    };
  }

  async initiatePanVerification(userId: string, pan: string, name: string) {
    const record = await this.getOrCreateRecord(userId, KycProvider.PAN, 1);

    // In production: call PanAdapter.verify()
    const fieldHashes = this.computeFieldHashes(name, '', pan);
    const attestationHash = this.computeAttestationHash(
      fieldHashes,
      KycProvider.PAN,
      Date.now(),
    );

    const updated = await this.prisma.kycRecord.update({
      where: { id: record.id },
      data: {
        status: KycStatus.VERIFIED,
        nameHash: fieldHashes.nameHash,
        panHash: fieldHashes.panHash,
        attestationHash,
        verifiedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      provider: updated.provider,
      status: updated.status,
      attestationHash: updated.attestationHash,
    };
  }

  async getDigiLockerAuthUrl(userId: string) {
    await this.getOrCreateRecord(userId, KycProvider.DIGILOCKER, 2);

    // In production: call DigiLockerAdapter.getAuthorizationUrl()
    return {
      authorizationUrl: 'https://digilocker-sandbox.example.com/authorize?client_id=test',
      provider: 'DIGILOCKER',
    };
  }

  async getKycStatus(userId: string) {
    const records = await this.prisma.kycRecord.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        status: true,
        providerLevel: true,
        attestationHash: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { kycStatus: true },
    });

    return {
      overallStatus: user?.kycStatus || KycStatus.NOT_STARTED,
      providers: records,
    };
  }

  /**
   * Get attestation data for ZK circuit input.
   * Returns only hashes — never raw identity data.
   */
  async getAttestationForProof(userId: string, provider: KycProvider) {
    const record = await this.prisma.kycRecord.findFirst({
      where: { userId, provider, status: KycStatus.VERIFIED },
    });
    if (!record) {
      throw new NotFoundException(`No verified ${provider} KYC found`);
    }

    return {
      nameHash: record.nameHash,
      dobHash: record.dobHash,
      panHash: record.panHash,
      attestationHash: record.attestationHash,
      providerLevel: record.providerLevel,
      verifiedAt: record.verifiedAt,
    };
  }

  private async getOrCreateRecord(
    userId: string,
    provider: KycProvider,
    providerLevel: number,
  ) {
    let record = await this.prisma.kycRecord.findFirst({
      where: { userId, provider },
    });

    if (!record) {
      record = await this.prisma.kycRecord.create({
        data: { userId, provider, providerLevel, status: KycStatus.IN_PROGRESS },
      });
    } else {
      record = await this.prisma.kycRecord.update({
        where: { id: record.id },
        data: { status: KycStatus.IN_PROGRESS, providerLevel },
      });
    }

    return record;
  }

  /**
   * Compute field hashes using Pedersen (SHA-256 placeholder).
   * In production: use Pedersen hash for ZK compatibility.
   */
  private computeFieldHashes(
    name: string,
    dob: string,
    pan: string,
  ): KycFieldHashes {
    return {
      nameHash: this.pedersenPlaceholder(name),
      dobHash: this.pedersenPlaceholder(dob),
      panHash: this.pedersenPlaceholder(pan),
    };
  }

  private computeAttestationHash(
    fields: KycFieldHashes,
    provider: KycProvider,
    timestamp: number,
  ): string {
    const input = `${fields.nameHash}:${fields.dobHash}:${fields.panHash}:${provider}:${timestamp}`;
    return this.pedersenPlaceholder(input);
  }

  private pedersenPlaceholder(input: string): string {
    return hashCommitment(input);
  }
}
