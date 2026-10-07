import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ArgumentDto, CreateArgumentDto } from '@argora/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import type { RequestWithDebate } from '../common/guards/visibility.guard';
import { User } from '../users/user.entity';
import { ArgumentsService } from './arguments.service';

@Controller('debates/:debateId/arguments')
export class ArgumentsController {
  constructor(private readonly args: ArgumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, VisibilityGuard)
  create(
    @Req() req: RequestWithDebate,
    @CurrentUser() user: User,
    @Body() dto: CreateArgumentDto,
  ): Promise<ArgumentDto> {
    return this.args.create(req.debate!, user, dto);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard, VisibilityGuard)
  list(
    @Req() req: RequestWithDebate,
    @CurrentUser() user: User | undefined,
  ): Promise<ArgumentDto[]> {
    return this.args.listForDebate(req.debate!, user);
  }
}

// Archive endpoint scoped on the argument itself, separate from the
// /debates/:debateId/arguments collection because the path doesn't need
// a debate id when we already hold the argument id. The param is named
// `argumentId` rather than `id` so VisibilityGuard reaches the debate
// through the argument instead of reading the value as a debate id.
@Controller('arguments')
export class ArgumentItemController {
  constructor(private readonly args: ArgumentsService) {}

  @Delete(':argumentId')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, VisibilityGuard)
  async archive(
    @CurrentUser() user: User,
    @Param('argumentId', new ParseUUIDPipe()) argumentId: string,
  ): Promise<void> {
    await this.args.archive(argumentId, user);
  }
}
