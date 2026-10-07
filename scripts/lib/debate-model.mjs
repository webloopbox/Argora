// Domain rules the evaluation scripts have to reproduce outside the API: the
// thesis-relative stance of a nested argument, the sentiment badge, and the
// cosine similarity behind duplicate detection. These are deliberate mirrors
// of production code - `effectiveStance` of
// apps/api/src/arguments/effective-stance.ts and `computeSentiment` of
// ArgumentsService - extracted here so the scripts share one copy rather than
// one per script. The behaviour is reproduced exactly as the scripts that
// produced the measurements in praca_pisemna.md ran it; changing any of it
// invalidates those numbers.

const CONTROVERSY_MAX_RATIO = 0.2;

/**
 * Stance toward the debate thesis. `side` alone is relative to the immediate
 * parent, so the parent chain is walked and the polarity flips on every
 * Against link. `byId` is a Map of argument id to argument; the hop cap guards
 * against a cycle in malformed input.
 */
export function effectiveStance(startId, byId) {
  let pro = true;
  let currentId = startId;
  let hops = 0;
  while (currentId && hops < 20) {
    const node = byId.get(currentId);
    if (!node) break;
    if (node.side === "against") pro = !pro;
    currentId = node.parentArgumentId;
    hops++;
  }
  return pro ? "pro" : "against";
}

/** Dominant mood of an argument's votes; `controversy` when they are balanced. */
export function computeSentiment(forCount, againstCount) {
  const weight = forCount + againstCount;
  if (weight === 0) return "neutral";
  const balanceRatio = Math.abs(forCount - againstCount) / weight;
  if (balanceRatio < CONTROVERSY_MAX_RATIO) return "controversy";
  return forCount >= againstCount ? "pro" : "against";
}

/** Shortens a quoted parent to `max` characters, with an ellipsis if cut. */
export function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function cosineSimilarity(a, b) {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * A vendor error worth retrying. The message starts with the HTTP status when
 * there was a response; anything without one (a socket error, a timeout) is
 * treated as transient too.
 */
export function isTransient(err) {
  const status = /^(\d{3})/.exec(err.message)?.[1];
  if (!status) return true;
  return status === "429" || status.startsWith("5");
}
