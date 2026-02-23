import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateShareDto {
  @IsString()
  @IsNotEmpty()
  proofId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720) // max 30 days
  expiresInHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxAccess?: number;
}
