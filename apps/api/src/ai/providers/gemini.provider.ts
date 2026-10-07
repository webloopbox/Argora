import { GoogleGenAI } from '@google/genai';
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

const MODEL_ID = 'gemini-2.5-flash';

export class GeminiProvider implements LlmProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  getModelInfo(): LlmProviderDto {
    return { id: MODEL_ID, name: 'Gemini 2.5 Flash', vendor: 'google' };
  }

  async generate(input: GenerateInput): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL_ID,
      contents: buildGeneratePrompt(input),
      config: { maxOutputTokens: GENERATE_MAX_TOKENS },
    });

    return (response.text ?? '').trim();
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL_ID,
      contents: buildSynthesisPrompt(input),
      config: { maxOutputTokens: SYNTHESIS_MAX_TOKENS },
    });

    return (response.text ?? '').trim();
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
    });
    return response.embeddings?.[0]?.values ?? [];
  }

  async classifySide(
    input: ClassifySideInput,
  ): Promise<'pro' | 'against' | null> {
    const response = await this.client.models.generateContent({
      model: MODEL_ID,
      contents: buildClassifySidePrompt(input),
      config: {
        maxOutputTokens: CLASSIFY_MAX_TOKENS,
        // Thinking eats the entire token budget for this trivial
        // single-word classification, leaving an empty response.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const rawText = response.text ?? '';
    return parseSide(rawText);
  }
}
