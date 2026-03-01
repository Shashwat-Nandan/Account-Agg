import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseEnumPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KycProvider } from '@prisma/client';
import { EkycService } from './ekyc.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VerifyAadhaarOtpDto, VerifyPanDto } from './ekyc.dto';

@Controller('ekyc')
export class EkycController {
  constructor(private readonly ekycService: EkycService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  getStatus(@CurrentUser('id') userId: string) {
    return this.ekycService.getKycStatus(userId);
  }

  // Aadhaar eKYC
  @UseGuards(AuthGuard('jwt'))
  @Post('aadhaar/otp')
  initiateAadhaar(@CurrentUser('id') userId: string) {
    return this.ekycService.initiateAadhaarKyc(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('aadhaar/verify')
  verifyAadhaar(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyAadhaarOtpDto,
  ) {
    return this.ekycService.verifyAadhaarOtp(
      userId,
      dto.transactionId,
      dto.otp,
    );
  }

  // PAN Verification
  @UseGuards(AuthGuard('jwt'))
  @Post('pan/verify')
  verifyPan(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPanDto,
  ) {
    return this.ekycService.initiatePanVerification(userId, dto.pan, dto.name);
  }

  // DigiLocker
  @UseGuards(AuthGuard('jwt'))
  @Get('digilocker/auth-url')
  getDigiLockerUrl(@CurrentUser('id') userId: string) {
    return this.ekycService.getDigiLockerAuthUrl(userId);
  }

  // Attestation data for ZK circuits
  @UseGuards(AuthGuard('jwt'))
  @Get('attestation/:provider')
  getAttestation(
    @CurrentUser('id') userId: string,
    @Param('provider', new ParseEnumPipe(KycProvider)) provider: KycProvider,
  ) {
    return this.ekycService.getAttestationForProof(userId, provider);
  }
}
