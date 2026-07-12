import { WatsonXAI } from '@ibm-cloud/watsonx-ai';
import { IamAuthenticator } from '@ibm-cloud/watsonx-ai/authentication';
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

// watsonx.ai serves many vendors' foundation models (IBM Granite, Meta Llama,
// Mistral, ...) behind one authenticated client, so a single provider class
// is parameterized by modelId rather than one class per vendor - the
// LlmRegistry registers one instance per catalog entry it wants to expose.
const API_VERSION = '2024-05-31';

export class WatsonxProvider implements LlmProvider {
  private readonly client: WatsonXAI;

  constructor(
    apiKey: string,
    serviceUrl: string,
    private readonly projectId: string,
    private readonly modelId: string,
    private readonly displayName: string,
  ) {
    this.client = new WatsonXAI({
      version: API_VERSION,
      serviceUrl,
      authenticator: new IamAuthenticator({ apikey: apiKey }),
    });
  }

  getModelInfo(): LlmProviderDto {
    return { id: this.modelId, name: this.displayName, vendor: 'ibm' };
  }

  private async chat(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.textChat({
      modelId: this.modelId,
      projectId: this.projectId,
      messages: [{ role: 'user', content: prompt }],
      maxTokens,
    });

    return (response.result.choices[0]?.message?.content ?? '').trim();
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
