import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: GeminiProvider | null;

  constructor(config: ConfigService) {
    const key = config.get<string>('GEMINI_API_KEY');
    this.provider = key ? new GeminiProvider(key) : null;
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.provider) {
      this.logger.warn('GEMINI_API_KEY not set - skipping embedding');
      return null;
    }
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
