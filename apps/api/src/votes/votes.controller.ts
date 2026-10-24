import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
// CastVoteDto must be a value import: `import type` erases the class, which
// makes TypeScript emit `Function` as the parameter type. ValidationPipe
// does not skip `Function`, so it would build the body with
// plainToInstance(Function, body) and `whitelist` would then strip every
// field - the vote would reach the service with no value at all.
import { ArgumentDto, CastVoteDto } from '@argora/core';
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
