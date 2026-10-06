import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ArgumentSide } from '../enums/debate.enums';
import type { ArgumentDto } from './argument.dto';

export class LlmProviderDto {
  id!: string;
  name!: string;
  vendor!: string;
}

export class GenerateArgumentDto {
  @IsUUID()
  debateId!: string;

  @IsEnum(ArgumentSide)
  side!: ArgumentSide;

  @IsString()
  modelId!: string;

  @IsOptional()
  @IsString()
  parentContent?: string;
}

export class GeneratedArgumentDto {
  content!: string;
  modelId!: string;
}

export class CheckDuplicateDto {
  @IsUUID()
  debateId!: string;

  @IsEnum(ArgumentSide)
  side!: ArgumentSide;

  @IsString()
  @MinLength(4)
  content!: string;

  @IsOptional()
  @IsUUID()
  parentArgumentId?: string | null;
}

export interface DuplicateCheckResultDto {
  duplicateOf?: ArgumentDto;
  similarity: number;
  threshold: number;
}

export class CheckArgumentSideDto {
  // Required so the endpoint can resolve the debate (and therefore its
  // thesis and language) through VisibilityGuard, like every other
  // debate-scoped call.
  @IsUUID()
  debateId!: string;

  @IsEnum(ArgumentSide)
  selectedSide!: ArgumentSide;

  @IsString()
  @MinLength(4)
  content!: string;

  // The text of the argument being replied to, and the frame the check runs in:
  // `selectedSide` is relative to this parent, so the model is asked about it
  // directly. Absent for an argument hanging straight off the thesis, where the
  // thesis itself plays that role. The parent's id is deliberately not part of
  // this contract - the check compares two texts and never walks the tree.
  @IsOptional()
  @IsString()
  parentContent?: string;
}

export interface ArgumentSideCheckResultDto {
  isMismatch: boolean;
  /** Local side (relative to the parent), so the client can drive its side selector directly. */
  suggestedSide?: ArgumentSide;
}

export class SynthesizeDto {
  @IsUUID()
  debateId!: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  argumentIds!: string[];

  @IsString()
  modelId!: string;
}

export class SynthesisResultDto {
  text!: string;
  modelId!: string;
}
