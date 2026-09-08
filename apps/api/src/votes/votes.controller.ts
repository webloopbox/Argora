import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ArgumentDto, CastVoteDto } from '@brainstorm/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import { User } from '../users/user.entity';
import { VotesService } from './votes.service';

// VisibilityGuard reaches the debate through `:argumentId`, so voting obeys
// exactly the same access rule as every other debate-scoped route.
@Controller('arguments/:argumentId/votes')
@UseGuards(JwtAuthGuard, VisibilityGuard)
export class VotesController {
  constructor(private readonly votes: VotesService) {}

  @Post()
  cast(
    @CurrentUser() user: User,
    @Param('argumentId', new ParseUUIDPipe()) argumentId: string,
    @Body() dto: CastVoteDto,
  ): Promise<ArgumentDto> {
    return this.votes.cast(argumentId, user, dto);
  }

  @Delete()
  retract(
    @CurrentUser() user: User,
    @Param('argumentId', new ParseUUIDPipe()) argumentId: string,
  ): Promise<ArgumentDto> {
    return this.votes.retract(argumentId, user);
  }
}
