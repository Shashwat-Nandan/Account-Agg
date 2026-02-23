import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OndcService } from './ondc.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('ondc')
export class OndcController {
  constructor(private readonly ondcService: OndcService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('search')
  search(@Body() body: { category: string; params?: Record<string, unknown> }) {
    return this.ondcService.searchProducts(body.category, body.params || {});
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('init')
  initOrder(
    @CurrentUser('id') userId: string,
    @Body() body: {
      productId: string;
      providerId: string;
      proofIds: string[];
    },
  ) {
    return this.ondcService.initOrder(
      body.productId,
      body.providerId,
      body.proofIds,
      userId,
    );
  }

  // Beckn callback endpoints
  @Post('on_search')
  onSearch(@Body() payload: unknown) {
    return this.ondcService.handleCallback('on_search', payload);
  }

  @Post('on_select')
  onSelect(@Body() payload: unknown) {
    return this.ondcService.handleCallback('on_select', payload);
  }

  @Post('on_init')
  onInit(@Body() payload: unknown) {
    return this.ondcService.handleCallback('on_init', payload);
  }

  @Post('on_confirm')
  onConfirm(@Body() payload: unknown) {
    return this.ondcService.handleCallback('on_confirm', payload);
  }

  @Post('on_status')
  onStatus(@Body() payload: unknown) {
    return this.ondcService.handleCallback('on_status', payload);
  }
}
