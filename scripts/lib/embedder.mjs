// Mirror of apps/api/src/ai/embedding.service.ts for the Node scripts, which
// cannot import the compiled Nest application. It has to pick the same vendor
// from the same environment variable, because a script that embeds with a
// different model than the API writes vectors the API cannot compare.
//
// Keep the provider selection and the calibrated thresholds in step with
// EmbeddingService; they are the one pair of values that must move together.

// e5 is trained with a task prefix on every input; see the comment in
// apps/api/src/ai/providers/local-embedding.provider.ts.
const E5_PREFIX = "query: ";
const DEFAULT_LOCAL_MODEL = "Xenova/multilingual-e5-small";

export const CALIBRATED_THRESHOLD = {
  gemini: 0.8,
  watsonx: 0.8,
  local: 0.91,
};

async function geminiEmbedder() {
  const { GoogleGenAI } = await import("@google/genai");
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is not set");
  const ai = new GoogleGenAI({ apiKey: key });
  return {
    vendor: "gemini",
    model: "gemini-embedding-001",
    // The free tier rate-limits hard, so callers pace themselves.
    delayMs: 300,
    async embed(text) {
      const res = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });
      return res.embeddings?.[0]?.values ?? [];
    },
  };
}

async function localEmbedder() {
  const modelId = process.env.LOCAL_EMBEDDING_MODEL || DEFAULT_LOCAL_MODEL;
  const { pipeline, env } = await import("@huggingface/transformers");
  if (process.env.LOCAL_EMBEDDING_CACHE_DIR) {
    env.cacheDir = process.env.LOCAL_EMBEDDING_CACHE_DIR;
  }
  const extractor = await pipeline("feature-extraction", modelId, { dtype: "fp32" });
  return {
    vendor: "local",
    model: modelId,
    // Runs in-process: no quota, no pacing needed.
    delayMs: 0,
    async embed(text) {
      const input = modelId.includes("e5") ? E5_PREFIX + text : text;
      const out = await extractor([input], { pooling: "mean", normalize: true });
      const [vector] = out.tolist();
      return vector ?? [];
    },
  };
}

// Resolves the provider the API would use for the same .env.
export async function createEmbedder() {
  const requested = process.env.EMBEDDING_PROVIDER;
  if (requested === "local") return localEmbedder();
  if (requested === "gemini" || !requested) return geminiEmbedder();
  if (requested === "watsonx") {
    throw new Error(
      "EMBEDDING_PROVIDER=watsonx is not mirrored in the scripts yet - " +
        "re-embed through the API or add a watsonx branch to scripts/lib/embedder.mjs",
    );
  }
  throw new Error(`Unknown EMBEDDING_PROVIDER: ${requested}`);
}

// Threshold sweeps have to cover the active model's own range: non-duplicate
// pairs sit around 0.62 for Gemini but around 0.83 for the local model, so a
// sweep ending at 0.9 says nothing about the latter.
export const SWEEP_POINTS = {
  gemini: [0.5, 0.6, 0.7, 0.75, 0.8, 0.9],
  watsonx: [0.5, 0.6, 0.7, 0.75, 0.8, 0.9],
  local: [0.8, 0.85, 0.88, 0.9, 0.91, 0.92, 0.95],
};
