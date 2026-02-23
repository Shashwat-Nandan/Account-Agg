import { IsString, IsPhoneNumber, IsOptional, IsEmail, Length } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}
