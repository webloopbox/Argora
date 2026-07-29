import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { DebateLanguage, DebateVisibility } from '../enums/debate.enums';

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

  // Optional so pre-existing clients keep working; the server falls back to
  // Polish, which is what every debate created before this field existed was.
  @IsOptional()
  @IsEnum(DebateLanguage)
  language?: DebateLanguage;
}

export interface DebateAuthorDto {
  id: string;
  displayName: string;
}

export interface DebatePreviewDto {
  id: string;
  thesis: string;
  visibility: DebateVisibility;
  language: DebateLanguage;
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
