import { GoogleGenAI } from '@google/genai';

// gemini-embedding-001 - used only for semantic duplicate detection, not
// exposed through LlmProvider (embeddings are not a text-generation task,
// see AiService.checkDuplicate). Vectors from this model are not comparable
// to vectors from any other embedding model, so switching provider requires
// re-embedding every previously stored argument (see scripts/reembed-existing.mjs).
const MODEL_ID = 'gemini-embedding-001';

export class GeminiEmbeddingProvider {
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.models.embedContent({
      model: MODEL_ID,
      contents: text,
    });
    return response.embeddings?.[0]?.values ?? [];
  }
}
