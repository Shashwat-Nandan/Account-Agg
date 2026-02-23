import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FiDataController } from './fi-data.controller';
import { FiDataService } from './fi-data.service';
import { MinioService } from './minio.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'fi-data' }),
  ],
  controllers: [FiDataController],
  providers: [FiDataService, MinioService],
  exports: [FiDataService, MinioService],
})
export class FiDataModule {}
