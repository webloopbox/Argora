// Output token budgets shared across every LLM provider so the Strategy
// implementations stay consistent and there is a single place to tune them.
//
// Synthesis produces a full Markdown report over a whole debate (or subgraph)
// and needs plenty of headroom - Polish tokenizes to more tokens per word than
// English, so a low cap truncated reports mid-sentence. Single-argument
// generation is capped to ~3 sentences, so a small budget is enough.
export const SYNTHESIS_MAX_TOKENS = 8192;
export const GENERATE_MAX_TOKENS = 2048;
