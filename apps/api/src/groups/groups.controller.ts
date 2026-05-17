import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CreateGroupDto,
  CreateInvitationDto,
  GroupDetailDto,
  GroupSummaryDto,
  InvitationDto,
} from '@brainstorm/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { GroupsService } from './groups.service';
import { InvitationsService } from './invitations.service';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groups: GroupsService,
    private readonly invitations: InvitationsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: User,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupDetailDto> {
    return this.groups.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: User): Promise<GroupSummaryDto[]> {
    return this.groups.listMine(user.id);
  }

  @Get(':id')
  detail(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<GroupDetailDto> {
    return this.groups.findDetail(id, user);
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.groups.archive(id, user);
  }

  @Post(':id/invitations')
  invite(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationDto> {
    return this.invitations.create(id, user, dto);
  }

  @Get(':id/invitations')
  listGroupInvitations(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<InvitationDto[]> {
    return this.invitations.listForGroup(id, user);
  }
}
