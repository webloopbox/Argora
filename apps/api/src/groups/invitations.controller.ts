import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { InvitationDto } from '@argora/core';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { InvitationsService } from './invitations.service';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<InvitationDto[]> {
    return this.invitations.listForCaller(user.id);
  }

  @Post(':id/accept')
  accept(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<InvitationDto> {
    return this.invitations.respond(id, user.id, true);
  }

  @Post(':id/decline')
  decline(
    @CurrentUser() user: User,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<InvitationDto> {
    return this.invitations.respond(id, user.id, false);
  }
}
