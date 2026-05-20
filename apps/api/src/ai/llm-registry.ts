import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProviderDto } from '@brainstorm/core';
import type { LlmProvider } from './llm-provider.interface';
import { ClaudeProvider } from './providers/claude.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Injectable()
export class LlmRegistry {
  private readonly providers = new Map<string, LlmProvider>();

  constructor(config: ConfigService) {
    const anthropicKey = config.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      const p = new ClaudeProvider(anthropicKey);
      this.providers.set(p.getModelInfo().id, p);
    }

    const openaiKey = config.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      const p = new OpenAiProvider(openaiKey);
      this.providers.set(p.getModelInfo().id, p);
    }
  }

  getActive(): LlmProviderDto[] {
    return Array.from(this.providers.values()).map((p) => p.getModelInfo());
  }

  get(modelId: string): LlmProvider | undefined {
    return this.providers.get(modelId);
  }
}
