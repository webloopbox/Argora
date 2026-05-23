import Anthropic from '@anthropic-ai/sdk';
import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';
import { buildSynthesisPrompt } from '../prompts/synthesis.prompt';

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
    const sideLabel = input.side === 'pro' ? 'Za' : 'Przeciw';
    const parentCtx = input.parentContent
      ? `\nOdpowiadasz na istniejący argument: "${input.parentContent}"\n`
      : '';

    const message = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
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

    const block = message.content[0];
    if (block.type !== 'text')
      throw new Error('Unexpected Claude response type');
    return block.text.trim();
  }

  async synthesize(input: SynthesizeInput): Promise<string> {
    const message = await this.client.messages.create({
      model: MODEL_ID,
      max_tokens: 2048,
      messages: [
        { role: 'user', content: buildSynthesisPrompt(input) },
      ],
    });

    const block = message.content[0];
    if (block.type !== 'text')
      throw new Error('Unexpected Claude response type');
    return block.text.trim();
  }
}
