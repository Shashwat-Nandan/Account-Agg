import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto, UpdateProfileDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('profile')
  updateProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}
