import { IsString, IsNotEmpty, IsObject, IsOptional, IsArray, ArrayMinSize } from 'class-validator';

export class SearchProductsDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}

export class InitOrderDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  providerId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  proofIds: string[];
}
