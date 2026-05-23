import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiThrottlerGuard } from '../common/guards/ai-throttler.guard';
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
  @UseGuards(JwtAuthGuard, AiThrottlerGuard)
  @Throttle({ 'ai-generate': { limit: 10, ttl: 60_000 } })
  generate(@Body() dto: GenerateArgumentDto) {
    return this.ai.generate(dto.modelId, {
      thesis: dto.thesis,
      side: dto.side as string,
      parentContent: dto.parentContent,
    });
  }

  @Post('arguments/check-duplicate')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-duplicate': { limit: 20, ttl: 60_000 } })
  checkDuplicate(@Body() dto: CheckDuplicateDto, @CurrentUser() caller: User) {
    return this.ai.checkDuplicate(dto, caller);
  }

  @Post('synthesize')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-synthesize': { limit: 5, ttl: 60_000 } })
  synthesize(@Body() dto: SynthesizeDto) {
    return this.ai.synthesize(dto.debateId, dto.argumentIds, dto.modelId);
  }
}
