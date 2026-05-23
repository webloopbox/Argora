import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { User } from '../users/user.entity';
import {
  CheckDuplicateDto,
  GenerateArgumentDto,
  SynthesizeDto,
} from '@brainstorm/core';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('providers')
  getProviders() {
    return this.ai.getProviders();
  }

  @Post('arguments/generate')
  @UseGuards(JwtAuthGuard)
  generate(@Body() dto: GenerateArgumentDto) {
    return this.ai.generate(dto.modelId, {
      thesis: dto.thesis,
      side: dto.side as string,
      parentContent: dto.parentContent,
    });
  }

  @Post('arguments/check-duplicate')
  @UseGuards(JwtAuthGuard, VisibilityGuard)
  checkDuplicate(@Body() dto: CheckDuplicateDto, @CurrentUser() caller: User) {
    return this.ai.checkDuplicate(dto, caller);
  }

  @Post('synthesize')
  @UseGuards(JwtAuthGuard, VisibilityGuard)
  synthesize(@Body() dto: SynthesizeDto) {
    return this.ai.synthesize(dto.debateId, dto.argumentIds, dto.modelId);
  }
}
