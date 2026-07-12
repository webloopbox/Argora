import type { LlmProviderDto } from '@brainstorm/core';

export interface GenerateInput {
  thesis: string;
  side: string;
  parentContent?: string;
}

export interface ClassifySideInput {
  thesis: string;
  content: string;
  parentContent?: string;
}

export interface SynthesizeArgInput {
  side: string;
  content: string;
  author: string;
  /**
   * Stance toward the debate thesis ('pro' | 'against'), resolved by walking the
   * parent chain and flipping polarity on every Against link - `side` alone is only
   * relative to the immediate parent, so it must not be used as a thesis-relative label.
   */
  effectiveStance: string;
  forCount: number;
  againstCount: number;
  weight: number;
  sentiment: string;
  /** Content of the parent argument (truncated upstream) - `null` for top-level. */
  parentContent: string | null;
}

export interface SynthesizeInput {
  thesis: string;
  arguments: SynthesizeArgInput[];
}

export interface LlmProvider {
  getModelInfo(): LlmProviderDto;
  generate(input: GenerateInput): Promise<string>;
  synthesize(input: SynthesizeInput): Promise<string>;
  classifySide(input: ClassifySideInput): Promise<'pro' | 'against' | null>;
}
