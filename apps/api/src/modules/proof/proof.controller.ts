import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProofService } from './proof.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitProofDto, VerifyProofDto } from './proof.dto';

@Controller('proofs')
export class ProofController {
  constructor(private readonly proofService: ProofService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  submit(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitProofDto,
  ) {
    return this.proofService.submitProof(
      userId,
      dto.circuitType as any,
      dto.publicInputs,
      dto.proofData,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.proofService.findAllByUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.proofService.findById(id);
  }

  /**
   * Public endpoint — anyone can verify a proof without authentication.
   */
  @Post('verify')
  verify(@Body() dto: VerifyProofDto) {
    return this.proofService.verifyPublic(
      dto.circuitType,
      dto.proofData,
      dto.publicInputs,
    );
  }
}
