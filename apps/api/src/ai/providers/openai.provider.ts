import OpenAI from 'openai';
import type { LlmProviderDto } from '@argora/core';
import type {
  ClassifySideInput,
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';
import { buildGeneratePrompt } from '../prompts/generate.prompt';
import { buildSynthesisPrompt } from '../prompts/synthesis.prompt';
import {
  buildClassifySidePrompt,
  parseSide,
} from '../prompts/classify-side.prompt';
import {
  CLASSIFY_MAX_TOKENS,
  GENERATE_MAX_TOKENS,
  SYNTHESIS_MAX_TOKENS,
} from '../ai.constants';

const MODEL_ID = 'gpt-4o';
const EMBEDDING_MODEL = 'text-embedding-3-small';

export class OpenAiProvider implements LlmProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  getModelInfo(): LlmProviderDto {
    return { id: MODEL_ID, name: 'GPT-4o', vendor: 'openai' };
  }

  async generate(input: GenerateInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: GENERATE_MAX_TOKENS,
      messages: [{ role: 'user', content: buildGeneratePrompt(input) }],
    });

    return completion.choices[0]?.message.content?.trim() ?? '';
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: SYNTHESIS_MAX_TOKENS,
      messages: [{ role: 'user', content: buildSynthesisPrompt(input) }],
    });

    return completion.choices[0]?.message.content?.trim() ?? '';
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0].embedding;
  }

  async classifySide(
    input: ClassifySideInput,
  ): Promise<'pro' | 'against' | null> {
    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: CLASSIFY_MAX_TOKENS,
      messages: [{ role: 'user', content: buildClassifySidePrompt(input) }],
    });

    return parseSide(completion.choices[0]?.message.content ?? '');
  }
}
