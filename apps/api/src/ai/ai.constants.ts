// Output token budgets shared across every LLM provider so the Strategy
// implementations stay consistent and there is a single place to tune them.
//
// Synthesis produces a full Markdown report over a whole debate (or subgraph)
// and needs plenty of headroom - Polish tokenizes to more tokens per word than
// English, so a low cap truncated reports mid-sentence. Single-argument
// generation is capped to ~3 sentences, so a small budget is enough.
export const SYNTHESIS_MAX_TOKENS = 8192;
export const GENERATE_MAX_TOKENS = 2048;
// Side classification needs only a single word BACK (ZA / PRZECIW), but the
// budget cannot be sized to that answer alone: reasoning models (DeepSeek V4
// Flash, Gemma 4 - both in the Together registry) spend the whole allowance on
// `message.reasoning` and return an EMPTY `message.content` with
// finish_reason=length. `parseSide` then reads that as "no opinion" and
// `checkArgumentSide` silently skips the mismatch warning, so the feature is
// dead for those vendors rather than visibly broken. Measured in
// praca_pisemna.md §7.4: at 20 tokens both models answered nothing on 79 of 80
// classifications; at 512 they answer correctly on the same prompts.
export const CLASSIFY_MAX_TOKENS = 512;
