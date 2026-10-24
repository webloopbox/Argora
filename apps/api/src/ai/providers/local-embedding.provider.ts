import type { FeatureExtractionPipeline } from '@huggingface/transformers';

// Embeddings computed in-process with ONNX Runtime - no API key, no quota, no
// network once the weights are cached. This is the provider that keeps the
// mandatory duplicate gate working on a clone of the repository with an empty
// .env, which no hosted vendor can offer.
//
// multilingual-e5-small covers both UI languages (pl is the default debate
// language) at 384 dimensions and ~120 MB of weights. The 768-dimension
// `multilingual-e5-base` measured only 4 points better on the paraphrase set
// (AUC 0.9866 vs 0.9839) for 2.3x the download, which is not worth it here.
export const DEFAULT_LOCAL_EMBEDDING_MODEL = 'Xenova/multilingual-e5-small';

// e5 was trained with a task prefix on every input and degrades sharply
// without one. The authors prescribe "query: " on both sides when the task is
// symmetric similarity rather than retrieval, which is exactly our case: two
// arguments are compared to each other, neither is a document being searched.
const E5_PREFIX = 'query: ';

export class LocalEmbeddingProvider {
  // The weights are loaded once, lazily, and shared. Loading on first use
  // rather than in the constructor keeps API boot instant even when the model
  // still has to be downloaded.
  private loading: Promise<FeatureExtractionPipeline> | null = null;

  constructor(
    private readonly modelId: string = DEFAULT_LOCAL_EMBEDDING_MODEL,
    private readonly cacheDir?: string,
  ) {}

  private load(): Promise<FeatureExtractionPipeline> {
    if (!this.loading) {
      this.loading = (async () => {
        // @huggingface/transformers is ESM-only; a dynamic import keeps it out
        // of the module graph until the provider is actually selected, so the
        // other providers do not pay for it.
        const { pipeline, env } = await import('@huggingface/transformers');
        if (this.cacheDir) env.cacheDir = this.cacheDir;
        return pipeline('feature-extraction', this.modelId, { dtype: 'fp32' });
      })().catch((err: unknown) => {
        // A failed download must not poison the provider for the process
        // lifetime - drop the cached promise so the next call retries.
        this.loading = null;
        throw err;
      });
    }
    return this.loading;
  }

  async embed(text: string): Promise<number[]> {
    const extractor = await this.load();
    const prefixed = this.modelId.includes('e5') ? E5_PREFIX + text : text;
    // Passing an array pins the output shape to [1, dim]; a bare string makes
    // the tensor rank depend on the model.
    const output = await extractor([prefixed], {
      pooling: 'mean',
      normalize: true,
    });
    const [vector] = output.tolist() as number[][];
    return vector ?? [];
  }
}
