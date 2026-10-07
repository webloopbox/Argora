import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmProviderDto } from '@argora/core';
import type { LlmProvider } from './llm-provider.interface';
import { WatsonxProvider } from './providers/watsonx.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { TogetherProvider } from './providers/together.provider';

// watsonx.ai foundation models exposed in the "generate argument" / "synthesize"
// UI, all served through the same IBM watsonx.ai account (one auth, one
// endpoint) - verified against this project's live catalog
// (GET /ml/v1/foundation_model_specs) to make sure every id is actually
// entitled and not deprecated/withdrawn. Registered independently of any
// other vendor below, so losing Watsonx credentials/availability only drops
// these three entries, never the whole registry.
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

    const geminiKey = config.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      const gemini = new GeminiProvider(geminiKey);
      this.providers.set(gemini.getModelInfo().id, gemini);
    }

    // together.ai stands in for the Watsonx-hosted comparison set above
    // while the IBM Cloud account is unreachable. Not the same three
    // vendors (Mistral and IBM aren't on Together's serverless catalog) -
    // this is a different genuinely-cross-vendor trio picked from what
    // Together actually serves. The "-Free" Llama id looks tempting but is
    // dedicated-endpoint only (HTTP 400 model_not_available on the
    // serverless chat-completions route); these three are the real
    // pay-per-token serverless models, billed against the prepaid balance.
    const togetherKey = config.get<string>('TOGETHER_API_KEY');
    if (togetherKey) {
      const TOGETHER_MODELS: {
        modelId: string;
        name: string;
        vendor: string;
      }[] = [
        {
          modelId: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
          name: 'Meta Llama 3.3 (Together)',
          vendor: 'meta',
        },
        {
          modelId: 'deepseek-ai/DeepSeek-V4-Flash-0731',
          name: 'DeepSeek V4 Flash (Together)',
          vendor: 'deepseek',
        },
        {
          modelId: 'google/gemma-4-31B-it',
          name: 'Gemma 4 31B (Together)',
          vendor: 'google',
        },
      ];

      for (const { modelId, name, vendor } of TOGETHER_MODELS) {
        const p = new TogetherProvider(togetherKey, modelId, name, vendor);
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
