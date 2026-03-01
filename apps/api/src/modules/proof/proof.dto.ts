import { IsString, IsObject, IsNotEmpty, IsEnum } from 'class-validator';
import { CircuitType } from '@prisma/client';

export class SubmitProofDto {
  @IsEnum(CircuitType)
  circuitType: CircuitType;

  @IsObject()
  publicInputs: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  proofData: string; // base64-encoded proof
}

export class VerifyProofDto {
  @IsEnum(CircuitType)
  circuitType: CircuitType;

  @IsString()
  @IsNotEmpty()
  proofData: string;

  @IsObject()
  publicInputs: Record<string, unknown>;
}
