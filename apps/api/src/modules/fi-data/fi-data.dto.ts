import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DataSessionStatus } from '@prisma/client';

export class CreateDataSessionDto {
  @IsString()
  @IsNotEmpty()
  consentId: string;
}

export class HandleFINotificationDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(DataSessionStatus)
  status: DataSessionStatus;
}
