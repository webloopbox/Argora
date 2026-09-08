import type { LlmProviderDto } from '@brainstorm/core';
import type {
  ClassifySideInput,
  GenerateInput,
  LlmProvider,
  SynthesizeInput,
} from '../llm-provider.interface';
import { buildGeneratePrompt } from '../prompts/generate.prompt';
import { buildSynthesisPrompt } from '../prompts/synthesis.prompt';
import {
  buildClassifySidePrompt,
  parseSide,
} from '../prompts/classify-side.prompt';
import {
  CLASSIFY_MAX_TOKENS,
  GENERATE_MAX_TOKENS,
  SYNTHESIS_MAX_TOKENS,
} from '../ai.constants';

// together.ai exposes an OpenAI-compatible chat-completions endpoint for many
// open-weight vendors' models, so - like WatsonxProvider - one class is
// parameterized by modelId rather than one class per vendor.
const API_URL = 'https://api.together.xyz/v1/chat/completions';

export class TogetherProvider implements LlmProvider {
  constructor(
    private readonly apiKey: string,
    private readonly modelId: string,
    private readonly displayName: string,
    private readonly vendor: string,
  ) {}

  getModelInfo(): LlmProviderDto {
    return { id: this.modelId, name: this.displayName, vendor: this.vendor };
  }

  private async chat(prompt: string, maxTokens: number): Promise<string> {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.modelId,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const err = new Error(
        `together.ai request failed: ${res.status} ${body}`.trim(),
      ) as Error & { status: number };
      err.status = res.status;
      throw err;
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return (json.choices?.[0]?.message?.content ?? '').trim();
  }

  generate(input: GenerateInput): Promise<string> {
    return this.chat(buildGeneratePrompt(input), GENERATE_MAX_TOKENS);
  }

  synthesize(input: SynthesizeInput): Promise<string> {
    return this.chat(buildSynthesisPrompt(input), SYNTHESIS_MAX_TOKENS);
  }

  async classifySide(
    input: ClassifySideInput,
  ): Promise<'pro' | 'against' | null> {
    const raw = await this.chat(
      buildClassifySidePrompt(input),
      CLASSIFY_MAX_TOKENS,
    );
    return parseSide(raw);
  }
}
