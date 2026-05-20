import OpenAI from 'openai';
import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';

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
    const argsText = input.arguments
      .map(
        (a, i) =>
          `${i + 1}. [${a.side === 'pro' ? 'ZA' : 'PRZECIW'}]${'  '.repeat(a.depth)} ${a.content}`,
      )
      .join('\n');

    const completion = await this.client.chat.completions.create({
      model: MODEL_ID,
      max_tokens: 768,
      messages: [
        {
          role: 'user',
          content:
            `Teza debaty: "${input.thesis}"\n\n` +
            `Wybrane argumenty:\n${argsText}\n\n` +
            `Napisz syntezę tych argumentów w 3–5 zdaniach po polsku. ` +
            `Wskaż główne punkty napięcia i wspólny grunt, jeśli istnieje.`,
        },
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
