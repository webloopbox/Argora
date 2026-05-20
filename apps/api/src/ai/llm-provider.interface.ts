import type { LlmProviderDto } from '@brainstorm/core';

export interface GenerateInput {
  thesis: string;
  side: string;
  parentContent?: string;
}

export interface SynthesizeInput {
  thesis: string;
  arguments: { side: string; content: string; depth: number }[];
}

export interface LlmProvider {
  getModelInfo(): LlmProviderDto;
  generate(input: GenerateInput): Promise<string>;
  synthesize(input: SynthesizeInput): Promise<string>;
}
