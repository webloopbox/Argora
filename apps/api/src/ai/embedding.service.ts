import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WatsonxEmbeddingProvider } from './providers/watsonx-embedding.provider';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly provider: WatsonxEmbeddingProvider | null;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('IBM_CLOUD_API_KEY');
    const projectId = config.get<string>('WATSONX_PROJECT_ID');
    const serviceUrl = config.get<string>('WATSONX_URL');
    const modelId = config.get<string>('WATSONX_EMBEDDING_MODEL_ID');

    this.provider =
      apiKey && projectId && serviceUrl
        ? new WatsonxEmbeddingProvider(apiKey, serviceUrl, projectId, modelId)
        : null;
  }

  async embed(text: string): Promise<number[] | null> {
    if (!this.provider) {
      this.logger.warn(
        'IBM_CLOUD_API_KEY/WATSONX_PROJECT_ID/WATSONX_URL not set - skipping embedding',
      );
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
