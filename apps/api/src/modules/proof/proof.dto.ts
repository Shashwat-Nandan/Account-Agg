import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class SubmitProofDto {
  @IsString()
  @IsNotEmpty()
  circuitType: string;

  @IsObject()
  publicInputs: Record<string, unknown>;

  @IsString()
  @IsNotEmpty()
  proofData: string; // base64-encoded proof
}

export class VerifyProofDto {
  @IsString()
  @IsNotEmpty()
  circuitType: string;

  @IsString()
  @IsNotEmpty()
  proofData: string;

  @IsObject()
  publicInputs: Record<string, unknown>;
}
