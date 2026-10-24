// Threshold sweep for duplicate detection: cosine similarity over embeddings,
// measured against a lexical baseline (Jaccard over tokens, no lemmatisation).
//
// How the counts work: TP = the gate fired and pointed at the right argument,
// FP = it fired on a submission that has no duplicate, or pointed at the wrong
// argument, FN = it stayed silent on a real duplicate.
//
// Requirements:
//   - DATABASE_URL in .env, plus credentials for whichever provider
//     EMBEDDING_PROVIDER names ("local" needs none)
//   - the debates in duplicate-eval-set.mjs must already carry embeddings from
//     THAT SAME provider (see scripts/reembed-existing.mjs); vectors from two
//     models are not comparable and yield worthless similarities
//
// Run:
//   node scripts/eval-duplicate-detection.mjs

import pg from "pg";
import { cosineSimilarity } from "./lib/debate-model.mjs";
import { loadEnv } from "./lib/env.mjs";
import { createEmbedder, SWEEP_POINTS } from "./lib/embedder.mjs";
import { DEBATES, submissions } from "./duplicate-eval-set.mjs";

loadEnv();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

const embedder = await createEmbedder();
const client = new pg.Client({ connectionString: dbUrl });

// Simplified normalisation, no lemmatisation: lowercase the text, drop
// punctuation, split on whitespace.
function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[.,!?;:()"'„”-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 0),
  );
}

function jaccard(setA, setB) {
  const intersection = [...setA].filter((t) => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  if (union === 0) return 0;
  return intersection / union;
}

const SEMANTIC_THRESHOLDS = SWEEP_POINTS[embedder.vendor];
// Jaccard sits on a different scale than cosine, because word overlap runs
// lower than similarity between dense semantic vectors. To keep the comparison
// fair, the lexical method gets its OWN best threshold instead of being judged
// at the cosine one.
const JACCARD_SWEEP = Array.from({ length: 19 }, (_, i) => 0.05 + i * 0.05);

function classify(results, getScore, threshold) {
  let correctHit = 0,
    wrongHit = 0,
    falseHit = 0,
    miss = 0,
    correctReject = 0;

  for (const { sub, matches } of results) {
    let best = null;
    for (const m of matches) {
      const score = getScore(m);
      if (!best || score > best.score) best = { ...m, score };
    }
    const detected = best && getScore(best) >= threshold;
    const expectHit = sub.expected !== null;

    if (expectHit && detected && best.content.includes(sub.expected)) correctHit++;
    else if (expectHit && detected) wrongHit++;
    else if (expectHit && !detected) miss++;
    else if (!expectHit && detected) falseHit++;
    else if (!expectHit && !detected) correctReject++;
  }

  const tp = correctHit;
  const fp = falseHit + wrongHit;
  const fn = miss;
  const precision = tp + fp === 0 ? null : tp / (tp + fp);
  const recall = tp + fn === 0 ? null : tp / (tp + fn);
  const f1 =
    precision === null || recall === null || precision + recall === 0
      ? null
      : (2 * precision * recall) / (precision + recall);

  return { correctHit, wrongHit, falseHit, miss, correctReject, precision, recall, f1 };
}

function fmt(v) {
  return v === null ? "-" : v.toFixed(2);
}

async function main() {
  await client.connect();

  const results = [];

  for (const sub of submissions) {
    const debateId = DEBATES[sub.debate];
    const { rows: candidates } = await client.query(
      `SELECT id, content, embedding FROM arguments
       WHERE debate_id = $1 AND side = $2 AND archived_on IS NULL`,
      [debateId, sub.side],
    );

    const vector = await embedder.embed(sub.content);
    if (!vector || vector.length === 0) {
      console.warn(`  Skipped (no embedding): ${sub.content.slice(0, 40)}...`);
      continue;
    }

    const subTokens = tokenize(sub.content);
    const matches = candidates.map((c) => ({
      id: c.id,
      content: c.content,
      cosine: cosineSimilarity(vector, c.embedding),
      jaccard: jaccard(subTokens, tokenize(c.content)),
    }));

    results.push({ sub, matches });
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("═══════════════════════════════════════════════════════════");
  console.log("Duplicate detection accuracy by threshold");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(
    "Thresh.".padEnd(24),
    "Right".padEnd(7),
    "Wrong".padEnd(7),
    "False".padEnd(7),
    "Missed".padEnd(9),
    "Precision".padEnd(10),
    "Recall".padEnd(10),
    "F1",
  );

  for (const t of SEMANTIC_THRESHOLDS) {
    const r = classify(results, (m) => m.cosine, t);
    console.log(
      String(t).padEnd(24),
      String(r.correctHit).padEnd(7),
      String(r.wrongHit).padEnd(7),
      String(r.falseHit).padEnd(7),
      String(r.miss).padEnd(9),
      fmt(r.precision).padEnd(10),
      fmt(r.recall).padEnd(10),
      fmt(r.f1),
    );
  }

  // Best threshold for the lexical baseline, chosen by F1.
  let bestJaccard = null;
  for (const t of JACCARD_SWEEP) {
    const r = classify(results, (m) => m.jaccard, t);
    if (r.f1 !== null && (!bestJaccard || r.f1 > bestJaccard.r.f1)) {
      bestJaccard = { threshold: t, r };
    }
  }
  console.log(
    `Lexical baseline`.padEnd(24),
    String(bestJaccard.r.correctHit).padEnd(7),
    String(bestJaccard.r.wrongHit).padEnd(7),
    String(bestJaccard.r.falseHit).padEnd(7),
    String(bestJaccard.r.miss).padEnd(9),
    fmt(bestJaccard.r.precision).padEnd(10),
    fmt(bestJaccard.r.recall).padEnd(10),
    fmt(bestJaccard.r.f1),
  );
  console.log(
    `\n(The lexical baseline is reported at its own best Jaccard threshold = ${bestJaccard.threshold.toFixed(2)}, picked by sweeping 0.05-0.95 in steps of 0.05 and maximising F1. Cosine and Jaccard thresholds are not numerically comparable.)`,
  );

  await client.end();
}

main().catch((err) => {
  console.error("Eval failed:", err.message);
  process.exit(1);
});
