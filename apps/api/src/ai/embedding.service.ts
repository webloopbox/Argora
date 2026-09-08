import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiEmbeddingProvider } from './providers/gemini-embedding.provider';
import { WatsonxEmbeddingProvider } from './providers/watsonx-embedding.provider';

interface Embedder {
  embed(text: string): Promise<number[]>;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: Embedder | null;

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

    if (requested === 'watsonx') this.provider = watsonx;
    else if (requested === 'gemini') this.provider = gemini;
    else this.provider = gemini ?? watsonx;

    if (!this.provider) {
      this.logger.warn(
        'No embedding provider configured (EMBEDDING_PROVIDER / GEMINI_API_KEY / Watsonx credentials) - duplicate detection disabled',
      );
    }
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
