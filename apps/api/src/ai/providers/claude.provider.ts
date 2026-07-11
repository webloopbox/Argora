import Anthropic from '@anthropic-ai/sdk';
import type { LlmProviderDto } from '@brainstorm/core';
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

const MODEL_ID = 'claude-sonnet-4-6';

export class ClaudeProvider implements LlmProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  getModelInfo(): LlmProviderDto {
    return { id: MODEL_ID, name: 'Claude Sonnet 4.6', vendor: 'anthropic' };
  }

  async generate(input: GenerateInput): Promise<string> {
    const message = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: GENERATE_MAX_TOKENS,
      messages: [{ role: 'user', content: buildGeneratePrompt(input) }],
    });

    const block = message.content[0];
    if (block.type !== 'text')
      throw new Error('Unexpected Claude response type');
    return block.text.trim();
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const message = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: SYNTHESIS_MAX_TOKENS,
      messages: [{ role: 'user', content: buildSynthesisPrompt(input) }],
    });

    const block = message.content[0];
    if (block.type !== 'text')
      throw new Error('Unexpected Claude response type');
    return block.text.trim();
  }

  async classifySide(input: ClassifySideInput): Promise<'pro' | 'against' | null> {
    const message = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: CLASSIFY_MAX_TOKENS,
      messages: [{ role: 'user', content: buildClassifySidePrompt(input) }],
    });

    const block = message.content[0];
    if (block.type !== 'text') return null;
    return parseSide(block.text);
  }
}
