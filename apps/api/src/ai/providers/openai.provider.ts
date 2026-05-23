import OpenAI from 'openai';
import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';
import { buildSynthesisPrompt } from '../prompts/synthesis.prompt';

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
    const sideLabel = input.side === 'pro' ? 'Za' : 'Przeciw';
    const parentCtx = input.parentContent
      ? `\nOdpowiadasz na istniejący argument: "${input.parentContent}"\n`
      : '';

    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content:
            `Teza debaty: "${input.thesis}"${parentCtx}\n` +
            `Wygeneruj jeden zwięzły argument ${sideLabel} tej tezie. ` +
            `Odpowiedź zawiera TYLKO treść argumentu — bez wstępu, numeracji ani cudzysłowów. ` +
            `Maksymalnie 3 zdania. Pisz po polsku.`,
        },
      ],
    });

    return completion.choices[0]?.message.content?.trim() ?? '';
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: buildSynthesisPrompt(input) },
      ],
    });

    return completion.choices[0]?.message.content?.trim() ?? '';
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0]!.embedding;
  }
}
