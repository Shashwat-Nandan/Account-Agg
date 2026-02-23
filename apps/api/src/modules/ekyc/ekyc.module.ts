import { Module } from '@nestjs/common';
import { EkycController } from './ekyc.controller';
import { EkycService } from './ekyc.service';

@Module({
  controllers: [EkycController],
  providers: [EkycService],
  exports: [EkycService],
})
export class EkycModule {}
