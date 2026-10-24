import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from './providers/gemini-embedding.provider';
import { WatsonxEmbeddingProvider } from './providers/watsonx-embedding.provider';
import { LocalEmbeddingProvider } from './providers/local-embedding.provider';

interface Embedder {
  embed(text: string): Promise<number[]>;
}

type EmbeddingVendor = 'gemini' | 'watsonx' | 'local';

// The duplicate cut-off is a property of the embedding model, not of the
// domain: each model puts non-duplicate pairs in a different part of the
// cosine range, so one constant cannot serve all three.
//
// Calibrated by replaying all 153 active arguments as if each were being
// submitted now and counting how often the gate fires against its same-debate,
// same-side peers. Every such firing is a false alarm by construction: the
// argument is stored precisely because it is not a duplicate. This
// per-submission rate is the one users feel, and it runs ~8x the per-pair rate
// because the gate takes the maximum over every peer, so calibrating on pairs
// understates it badly.
//
//   gemini-embedding-001   @0.80 ->  6.0% of submissions fire (9/149)
//   multilingual-e5-small  @0.91 ->  4.6% of submissions fire (7/153)
//   multilingual-e5-small  @0.80 -> 100%  of submissions fire (153/153)
//
// 0.91 therefore reproduces the false-alarm rate the UI was designed around
// rather than merely looking like a high number. What it costs is recall: on
// 29 hand-written paraphrases of real arguments it catches 66%, where Gemini's
// wider spread (non-duplicates median 0.618 vs 0.834) lets 0.80 catch nearly
// all of them. Reusing 0.80 here would put the merge/nuance dialog in front of
// every single submission, so these values must never be swapped
// independently - which is why the default lives next to the provider choice
// instead of in ai.service.ts. DUPLICATE_THRESHOLD still overrides it.
//
// The watsonx figure is inherited, not measured: granite-embedding-278m was
// never benchmarked this way, so it keeps the historical default.
const CALIBRATED_THRESHOLD: Record<EmbeddingVendor, number> = {
  gemini: 0.8,
  watsonx: 0.8,
  local: 0.91,
};

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: Embedder | null;

  // The cosine cut-off above which two arguments count as duplicates. Read it
  // from here rather than re-deriving it, so it cannot drift from the active
  // provider it was calibrated against.
  readonly duplicateThreshold: number;

  // EMBEDDING_PROVIDER picks which vendor backs duplicate detection. Vectors
  // from different embedding models are not comparable, so this is a single
  // active provider, not a per-request choice like LlmProvider - switching
  // back (e.g. once the Watsonx instance is reactivated) is a one-line .env
  // change, but every previously stored embedding must be recomputed first
  // (see scripts/reembed-existing.mjs).
  constructor(config: ConfigService) {
    const requested = config.get<string>('EMBEDDING_PROVIDER');

    const watsonxKey = config.get<string>('IBM_CLOUD_API_KEY');
    const watsonxProject = config.get<string>('WATSONX_PROJECT_ID');
    const watsonxUrl = config.get<string>('WATSONX_URL');
    const watsonx =
      watsonxKey && watsonxProject && watsonxUrl
        ? new WatsonxEmbeddingProvider(
            watsonxKey,
            watsonxUrl,
            watsonxProject,
            config.get<string>('WATSONX_EMBEDDING_MODEL_ID'),
          )
        : null;

    const geminiKey = config.get<string>('GEMINI_API_KEY');
    const gemini = geminiKey ? new GeminiEmbeddingProvider(geminiKey) : null;

    // The local provider needs no credentials, so it is the one vendor that is
    // always constructible - and therefore the last-resort fallback that keeps
    // the mandatory duplicate gate alive on an unconfigured checkout.
    const local = new LocalEmbeddingProvider(
      config.get<string>('LOCAL_EMBEDDING_MODEL') ?? undefined,
      config.get<string>('LOCAL_EMBEDDING_CACHE_DIR') ?? undefined,
    );

    let vendor: EmbeddingVendor;
    if (requested === 'watsonx' && watsonx) vendor = 'watsonx';
    else if (requested === 'gemini' && gemini) vendor = 'gemini';
    else if (requested === 'local') vendor = 'local';
    else if (!requested && gemini) vendor = 'gemini';
    else if (!requested && watsonx) vendor = 'watsonx';
    else {
      // Either nothing was configured, or the requested vendor's credentials
      // are missing. Falling back silently would be worse than saying so:
      // vectors already stored by another model are not comparable to the
      // local ones, so this needs a re-embed pass to mean anything.
      if (requested) {
        this.logger.warn(
          `EMBEDDING_PROVIDER=${requested} has no usable credentials - falling back to the local model. Stored vectors from another provider are not comparable; run scripts/reembed-existing.mjs`,
        );
      }
      vendor = 'local';
    }

    this.provider =
      vendor === 'watsonx' ? watsonx : vendor === 'gemini' ? gemini : local;
    this.duplicateThreshold =
      parseFloat(config.get<string>('DUPLICATE_THRESHOLD') ?? '') ||
      CALIBRATED_THRESHOLD[vendor];

    this.logger.log(
      `Embedding provider: ${vendor} (duplicate threshold ${this.duplicateThreshold})`,
    );
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.provider) return null;
    try {
      return await this.provider.embed(text);
    } catch (err) {
      this.logger.error('Embedding failed', err);
      return null;
    }
  }

  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
