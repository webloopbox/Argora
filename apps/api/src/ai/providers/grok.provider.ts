import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';

export class GrokProvider implements LlmProvider {
  getModelInfo(): LlmProviderDto {
    return { id: 'grok-2', name: 'Grok 2', vendor: 'xai' };
  }

  generate(_input: GenerateInput): Promise<string> {
    throw new Error('GrokProvider not implemented');
  }

  synthesize(_input: SynthesizeInput): Promise<string> {
    throw new Error('GrokProvider not implemented');
  }
}
