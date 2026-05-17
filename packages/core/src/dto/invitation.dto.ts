import { IsUUID } from 'class-validator';
import { InvitationStatus } from '../enums/invitation.enums';

export class CreateInvitationDto {
  @IsUUID()
  inviteeId!: string;
}

export interface InvitationGroupPreviewDto {
  id: string;
  name: string;
}

export interface InvitationUserPreviewDto {
  id: string;
  displayName: string;
}

export interface InvitationDto {
  id: string;
  status: InvitationStatus;
  group: InvitationGroupPreviewDto;
  inviter: InvitationUserPreviewDto;
  invitee: InvitationUserPreviewDto;
  createdAt: string;
  respondedAt: string | null;
}
