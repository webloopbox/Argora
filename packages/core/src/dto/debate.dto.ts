import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { DebateVisibility } from '../enums/debate.enums';

const THESIS_MAX = 280;
const THESIS_MIN = 8;

export class CreateDebateDto {
  @IsString()
  @MinLength(THESIS_MIN)
  @MaxLength(THESIS_MAX)
  thesis!: string;

  @IsEnum(DebateVisibility)
  visibility!: DebateVisibility;

  @ValidateIf((o: CreateDebateDto) => o.visibility === DebateVisibility.Private)
  @IsUUID()
  groupId?: string | null;
}

export interface DebateAuthorDto {
  id: string;
  displayName: string;
}

export interface DebatePreviewDto {
  id: string;
  thesis: string;
  visibility: DebateVisibility;
  groupId: string | null;
  author: DebateAuthorDto;
  argumentCount: number;
  proCount: number;
  againstCount: number;
  createdAt: string;
}

export interface DebateDetailDto extends DebatePreviewDto {}

export class DebateListQueryDto {
  @IsOptional()
  @IsUUID()
  groupId?: string;
}
