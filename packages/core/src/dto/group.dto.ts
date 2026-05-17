import { IsString, MaxLength, MinLength } from 'class-validator';

export const GROUP_NAME_MIN = 3;
export const GROUP_NAME_MAX = 64;

export class CreateGroupDto {
  @IsString()
  @MinLength(GROUP_NAME_MIN)
  @MaxLength(GROUP_NAME_MAX)
  name!: string;
}

export interface GroupMemberDto {
  id: string;
  displayName: string;
  isOwner: boolean;
  joinedAt: string;
}

export interface GroupSummaryDto {
  id: string;
  name: string;
  ownerId: string;
  ownerDisplayName: string;
  memberCount: number;
  debateCount: number;
  createdAt: string;
  isOwner: boolean;
}

export interface GroupDetailDto extends GroupSummaryDto {
  members: GroupMemberDto[];
}
