import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EkycService } from './ekyc.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
    @Body() body: { transactionId: string; otp: string },
  ) {
    return this.ekycService.verifyAadhaarOtp(
      userId,
      body.transactionId,
      body.otp,
    );
  }

  // PAN Verification
  @UseGuards(AuthGuard('jwt'))
  @Post('pan/verify')
  verifyPan(
    @CurrentUser('id') userId: string,
    @Body() body: { pan: string; name: string },
  ) {
    return this.ekycService.initiatePanVerification(userId, body.pan, body.name);
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
    @Param('provider') provider: string,
  ) {
    return this.ekycService.getAttestationForProof(userId, provider as any);
  }
}
