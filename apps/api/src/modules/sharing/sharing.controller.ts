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
import { SharingService } from './sharing.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateShareDto } from './sharing.dto';

@Controller('share')
export class SharingController {
  constructor(private readonly sharingService: SharingService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.sharingService.createShare(
      userId,
      dto.proofId,
      dto.recipientId,
      dto.purpose,
      dto.expiresInHours,
      dto.maxAccess,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.sharingService.findAllByUser(userId);
  }

  /**
   * Public endpoint — third parties access shared proof via token.
   * No authentication required; access controlled by token + expiry + max access.
   */
  @Get(':token')
  getShared(@Param('token') token: string) {
    return this.sharingService.getSharedProof(token);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  revoke(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.revoke(id, userId);
  }
}
