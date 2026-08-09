import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiThrottlerGuard } from '../common/guards/ai-throttler.guard';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import type { RequestWithDebate } from '../common/guards/visibility.guard';
import { User } from '../users/user.entity';
import {
  CheckArgumentSideDto,
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

  // Each route owns exactly one throttler bucket and skips the other three.
  // Without the skips ThrottlerGuard would also apply the untouched buckets at
  // their registered defaults, and the strictest of them (ai-synthesize, 5/min)
  // would become the effective limit everywhere - see the note in app.module.ts.

  // VisibilityGuard resolves `debateId` from the body and attaches the row, so
  // the handler can hand the service an authoritative debate - the AI calls are
  // debate-scoped now that they read its language.
  @Post('arguments/generate')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-generate': { limit: 10, ttl: 60_000 } })
  @SkipThrottle({
    'ai-duplicate': true,
    'ai-check-side': true,
    'ai-synthesize': true,
  })
  generate(@Body() dto: GenerateArgumentDto, @Req() req: RequestWithDebate) {
    return this.ai.generate(req.debate!, dto);
  }

  @Post('arguments/check-duplicate')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-duplicate': { limit: 20, ttl: 60_000 } })
  @SkipThrottle({
    'ai-generate': true,
    'ai-check-side': true,
    'ai-synthesize': true,
  })
  checkDuplicate(@Body() dto: CheckDuplicateDto, @CurrentUser() caller: User) {
    return this.ai.checkDuplicate(dto, caller);
  }

  @Post('arguments/check-side')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-check-side': { limit: 20, ttl: 60_000 } })
  @SkipThrottle({
    'ai-generate': true,
    'ai-duplicate': true,
    'ai-synthesize': true,
  })
  checkArgumentSide(
    @Body() dto: CheckArgumentSideDto,
    @Req() req: RequestWithDebate,
  ) {
    return this.ai.checkArgumentSide(req.debate!, dto);
  }

  @Post('synthesize')
  @UseGuards(JwtAuthGuard, VisibilityGuard, AiThrottlerGuard)
  @Throttle({ 'ai-synthesize': { limit: 5, ttl: 60_000 } })
  @SkipThrottle({
    'ai-generate': true,
    'ai-duplicate': true,
    'ai-check-side': true,
  })
  synthesize(@Body() dto: SynthesizeDto) {
    return this.ai.synthesize(dto.debateId, dto.argumentIds, dto.modelId);
  }
}
