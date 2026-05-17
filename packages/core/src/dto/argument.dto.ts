import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ArgumentSide } from '../enums/debate.enums';

const ARGUMENT_MAX = 2000;
const ARGUMENT_MIN = 4;

export class CreateArgumentDto {
  @IsEnum(ArgumentSide)
  side!: ArgumentSide;

  @IsString()
  @MinLength(ARGUMENT_MIN)
  @MaxLength(ARGUMENT_MAX)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentArgumentId?: string | null;

  @IsOptional()
  @IsBoolean()
  isAiGenerated?: boolean;
}

export type ArgumentSentiment = 'pro' | 'against' | 'controversy' | 'neutral';

export interface ArgumentAuthorDto {
  id: string;
  displayName: string;
}

export interface ArgumentDto {
  id: string;
  debateId: string;
  parentArgumentId: string | null;
  side: ArgumentSide;
  content: string;
  author: ArgumentAuthorDto;
  isAiGenerated: boolean;
  createdAt: string;

  // Voting summary attached server-side by ArgumentsService. `weight` is the
  // absolute sum (|forCount| + |againstCount|), not a net score - per
  // CLAUDE.md every reaction increases visibility regardless of direction.
  // `userVote` is null for anonymous callers or authenticated users who
  // haven't voted.
  forCount: number;
  againstCount: number;
  weight: number;
  sentiment: ArgumentSentiment;
  userVote: 1 | -1 | null;
}
