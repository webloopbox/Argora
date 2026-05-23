import type { LlmProviderDto } from '@brainstorm/core';

export interface GenerateInput {
  thesis: string;
  side: string;
  parentContent?: string;
}

export interface SynthesizeArgInput {
  side: string;
  content: string;
  author: string;
  depth: number;
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
}
