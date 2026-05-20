import type { LlmProviderDto } from '@brainstorm/core';
import type {
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';

export class MistralProvider implements LlmProvider {
  getModelInfo(): LlmProviderDto {
    return { id: 'mistral-large', name: 'Mistral Large', vendor: 'mistral' };
  }

  generate(_input: GenerateInput): Promise<string> {
    throw new Error('MistralProvider not implemented');
  }

  synthesize(_input: SynthesizeInput): Promise<string> {
    throw new Error('MistralProvider not implemented');
  }
}
