import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProviderDto } from '@brainstorm/core';
import type { LlmProvider } from './llm-provider.interface';
import { WatsonxProvider } from './providers/watsonx.provider';

// watsonx.ai foundation models exposed in the "generate argument" / "synthesize"
// UI. All served through the same IBM watsonx.ai account (one auth, one
// endpoint) - verified against this project's live catalog
// (GET /ml/v1/foundation_model_specs) to make sure every id is actually
// entitled and not deprecated/withdrawn.
const WATSONX_MODELS: { modelId: string; name: string }[] = [
  { modelId: 'ibm/granite-4-h-small', name: 'IBM Granite 4' },
  { modelId: 'meta-llama/llama-3-3-70b-instruct', name: 'Meta Llama 3.3' },
  {
    modelId: 'mistralai/mistral-small-3-1-24b-instruct-2503',
    name: 'Mistral Small 3.1',
  },
];

@Injectable()
export class LlmRegistry {
  private readonly providers = new Map<string, LlmProvider>();

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('IBM_CLOUD_API_KEY');
    const projectId = config.get<string>('WATSONX_PROJECT_ID');
    const serviceUrl = config.get<string>('WATSONX_URL');

    if (apiKey && projectId && serviceUrl) {
      for (const { modelId, name } of WATSONX_MODELS) {
        const p = new WatsonxProvider(
          apiKey,
          serviceUrl,
          projectId,
          modelId,
          name,
        );
        this.providers.set(p.getModelInfo().id, p);
      }
    }
  }

  getActive(): LlmProviderDto[] {
    return Array.from(this.providers.values()).map((p) => p.getModelInfo());
  }

  get(modelId: string): LlmProvider | undefined {
    return this.providers.get(modelId);
  }
}
