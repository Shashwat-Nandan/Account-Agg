import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FiDataService } from './fi-data.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwsVerificationGuard } from '../../common/guards/jws-verification.guard';

@Controller('fi-data')
export class FiDataController {
  constructor(private readonly fiDataService: FiDataService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('sessions')
  createSession(
    @Body('consentId') consentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fiDataService.createDataSession(consentId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sessions')
  getSessions(@CurrentUser('id') userId: string) {
    return this.fiDataService.getSessionsByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('sessions/:id')
  getData(
    @Param('id') sessionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fiDataService.getFIData(sessionId, userId);
  }

  /**
   * Webhook for FI data ready notification from Setu.
   */
  @UseGuards(JwsVerificationGuard)
  @Post('webhooks/fi-notification')
  handleFINotification(@Body() body: {
    FIStatusNotification: {
      sessionId: string;
      sessionStatus: string;
    };
  }) {
    const { sessionId, sessionStatus } = body.FIStatusNotification;
    return this.fiDataService.handleFINotification(sessionId, sessionStatus);
  }
}
