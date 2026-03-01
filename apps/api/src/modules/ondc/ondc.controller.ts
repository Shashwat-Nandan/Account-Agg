import {
  Controller,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OndcService } from './ondc.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SearchProductsDto, InitOrderDto } from './ondc.dto';

@Controller('ondc')
export class OndcController {
  constructor(private readonly ondcService: OndcService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('search')
  search(@Body() dto: SearchProductsDto) {
    return this.ondcService.searchProducts(dto.category, dto.params || {});
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('init')
  initOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: InitOrderDto,
  ) {
    return this.ondcService.initOrder(
      dto.productId,
      dto.providerId,
      dto.proofIds,
      userId,
    );
  }

  // Beckn callback endpoints
  @Post('on_search')
  onSearch(@Body() payload: Record<string, unknown>) {
    return this.ondcService.handleCallback('on_search', payload);
  }

  @Post('on_select')
  onSelect(@Body() payload: Record<string, unknown>) {
    return this.ondcService.handleCallback('on_select', payload);
  }

  @Post('on_init')
  onInit(@Body() payload: Record<string, unknown>) {
    return this.ondcService.handleCallback('on_init', payload);
  }

  @Post('on_confirm')
  onConfirm(@Body() payload: Record<string, unknown>) {
    return this.ondcService.handleCallback('on_confirm', payload);
  }

  @Post('on_status')
  onStatus(@Body() payload: Record<string, unknown>) {
    return this.ondcService.handleCallback('on_status', payload);
  }
}
