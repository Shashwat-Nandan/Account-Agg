import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'consent' }),
  ],
  controllers: [ConsentController],
  providers: [ConsentService],
  exports: [ConsentService],
})
export class ConsentModule {}
