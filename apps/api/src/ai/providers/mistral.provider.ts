import type { LlmProviderDto } from '@brainstorm/core';
import type { LlmProvider } from '../llm-provider.interface';

export class MistralProvider implements LlmProvider {
  getModelInfo(): LlmProviderDto {
    return { id: 'mistral-large', name: 'Mistral Large', vendor: 'mistral' };
  }

  generate(): Promise<string> {
    throw new Error('MistralProvider not implemented');
  }

  synthesize(): Promise<string> {
    throw new Error('MistralProvider not implemented');
  }

  classifySide(): Promise<'pro' | 'against' | null> {
    throw new Error('MistralProvider not implemented');
  }
}
