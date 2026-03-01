import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyAadhaarOtpDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class VerifyPanDto {
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/, {
    message: 'PAN must be in format ABCDE1234F',
  })
  pan: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
