import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './consent.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwsVerificationGuard } from '../../common/guards/jws-verification.guard';

@Controller('consents')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateConsentDto,
  ) {
    return this.consentService.create({
      userId,
      vua: dto.vua,
      fiTypes: dto.fiTypes,
      purpose: dto.purpose,
      purposeCode: dto.purposeCode,
      dataRangeFrom: new Date(dto.dataRangeFrom),
      dataRangeTo: new Date(dto.dataRangeTo),
      consentDurationDays: dto.consentDurationDays,
      fetchType: dto.fetchType,
      consentMode: dto.consentMode,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.consentService.findAllByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consentService.findById(id, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  revoke(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.consentService.revoke(id, userId);
  }

  /**
   * Webhook endpoint for Setu consent status notifications.
   * Verified with JWS signature from AA.
   */
  @UseGuards(JwsVerificationGuard)
  @Post('webhooks/consent-notification')
  handleConsentNotification(@Body() body: {
    ConsentStatusNotification: {
      consentId: string;
      consentHandle: string;
      consentStatus: string;
    };
  }) {
    const { consentId, consentHandle, consentStatus } =
      body.ConsentStatusNotification;
    return this.consentService.handleConsentNotification(
      consentId,
      consentHandle,
      consentStatus as any,
    );
  }
}
