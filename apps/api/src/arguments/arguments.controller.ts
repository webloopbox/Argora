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
import { ArgumentDto, CreateArgumentDto } from '@brainstorm/core';
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
  list(@Req() req: RequestWithDebate): Promise<ArgumentDto[]> {
    return this.args.listForDebate(req.debate!);
  }
}

// Archive endpoint scoped on the argument itself, separate from the
// /debates/:debateId/arguments collection because the path doesn't need
// a debate id when we already hold the argument id.
@Controller('arguments')
export class ArgumentItemController {
  constructor(private readonly args: ArgumentsService) {}

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  async archive(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.args.archive(id, user);
  }
}
