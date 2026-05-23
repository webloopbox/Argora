import { GoogleGenAI } from '@google/genai';
import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';
import { buildSynthesisPrompt } from '../prompts/synthesis.prompt';

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
    const sideLabel = input.side === 'pro' ? 'Za' : 'Przeciw';
    const parentCtx = input.parentContent
      ? `\nOdpowiadasz na istniejący argument: "${input.parentContent}"\n`
      : '';

    const response = await this.client.models.generateContent({
      model: MODEL_ID,
      contents:
        `Teza debaty: "${input.thesis}"\n` +
        (parentCtx ? `${parentCtx}` : '') +
        `Wygeneruj jeden zwięzły argument ${sideLabel} ${input.parentContent ? 'powyższemu argumentowi' : 'tej tezie'}. ` +
        `Odpowiedź zawiera TYLKO treść argumentu - bez wstępu, numeracji ani cudzysłowów. ` +
        `Maksymalnie 3 zdania. Pisz po polsku.`,
      config: { maxOutputTokens: 2048 },
    });

    return (response.text ?? '').trim();
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const response = await this.client.models.generateContent({
      model: MODEL_ID,
      contents: buildSynthesisPrompt(input),
      config: { maxOutputTokens: 2048 },
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
}
