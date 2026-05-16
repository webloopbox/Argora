import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  CreateDebateDto,
  DebateDetailDto,
  DebateListQueryDto,
  DebatePreviewDto,
} from '@brainstorm/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { VisibilityGuard } from '../common/guards/visibility.guard';
import type { RequestWithDebate } from '../common/guards/visibility.guard';
import { User } from '../users/user.entity';
import { DebatesService } from './debates.service';

@Controller('debates')
export class DebatesController {
  constructor(private readonly debates: DebatesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateDebateDto,
  ): Promise<DebateDetailDto> {
    return this.debates.create(user, dto);
  }

  // Public listing: anonymous visitors see public debates. Logged-in
  // callers can also pass `?groupId=` to read a private group's debates -
  // that branch enforces membership in the service.
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @CurrentUser() user: User | undefined,
    @Query() query: DebateListQueryDto,
  ): Promise<DebatePreviewDto[]> {
    if (query.groupId) {
      if (!user) {
        return [];
      }
      return this.debates.listForGroup(query.groupId, user.id);
    }
    return this.debates.listPublic();
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard, VisibilityGuard)
  detail(@Req() req: RequestWithDebate): Promise<DebateDetailDto> {
    return this.debates.findDetail(req.debate!);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, VisibilityGuard)
  async archive(
    @CurrentUser() user: User,
    @Req() req: RequestWithDebate,
  ): Promise<void> {
    await this.debates.archive(req.debate!, user);
  }
}
