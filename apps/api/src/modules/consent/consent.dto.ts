import {
  IsString,
  IsArray,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';

export class CreateConsentDto {
  @IsString()
  vua: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  fiTypes: string[];

  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  purposeCode?: string;

  @IsDateString()
  dataRangeFrom: string;

  @IsDateString()
  dataRangeTo: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  consentDurationDays?: number;

  @IsOptional()
  @IsString()
  fetchType?: string;

  @IsOptional()
  @IsString()
  consentMode?: string;
}
