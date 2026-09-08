// Wypełnia Tabelę 7.3 (praca_pisemna.md, §7.3.2): przemiatanie progu
// podobieństwa kosinusowego (metoda semantyczna, Gemini) oraz punkt
// odniesienia leksykalny (Jaccard na tokenach, bez lematyzacji - patrz
// zaktualizowany akapit w §7.3.1).
//
// Definicje TP/FP/FN wg §7.3.1: TP = wskazanie poprawne, FP = wykrycie
// fałszywe LUB wskazanie błędne, FN = przeoczenie.
//
// Wymagania:
//   - GEMINI_API_KEY i DATABASE_URL w .env
//   - Debaty z duplicate-eval-set.mjs muszą mieć już policzone embeddingi
//     Gemini (patrz scripts/reembed-existing.mjs)
//
// Uruchomienie:
//   node scripts/eval-duplicate-detection.mjs

import { GoogleGenAI } from "@google/genai";
import pg from "pg";
import * as fs from "fs";
import * as path from "path";
import { DEBATES, submissions } from "./duplicate-eval-set.mjs";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
}

const geminiKey = process.env.GEMINI_API_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!geminiKey) throw new Error("GEMINI_API_KEY not set in .env");
if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

const ai = new GoogleGenAI({ apiKey: geminiKey });
const client = new pg.Client({ connectionString: dbUrl });

// Identyczna implementacja jak EmbeddingService.cosineSimilarity.
function cosineSimilarity(a, b) {
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

// Uproszczona normalizacja bez lematyzacji (małe litery, usunięcie
// interpunkcji, podział na tokeny) - patrz zaktualizowany akapit w §7.3.1.
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

const SEMANTIC_THRESHOLDS = [0.5, 0.6, 0.7, 0.75, 0.8, 0.9];
// Jaccard operuje w innej skali niż cosinus (pokrywanie się słów jest
// z natury niższe niż podobieństwo gęstych wektorów semantycznych) - żeby
// porównanie z hipotezą H1 było uczciwe, dla metody leksykalnej szukamy jej
// WŁASNEGO najlepszego progu zamiast oceniać ją przy 0,75.
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
  return v === null ? "-" : v.toFixed(2).replace(".", ",");
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

    const embedRes = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: sub.content,
    });
    const vector = embedRes.embeddings?.[0]?.values;
    if (!vector) {
      console.warn(`  Pominięto (brak embeddingu): ${sub.content.slice(0, 40)}...`);
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
  console.log("Tabela 7.3 - Skuteczność detekcji powtórzeń w funkcji progu");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(
    "Próg".padEnd(24),
    "Popr.".padEnd(7),
    "Błęd.".padEnd(7),
    "Fałsz.".padEnd(7),
    "Przeocz.".padEnd(9),
    "Precyzja".padEnd(10),
    "Czułość".padEnd(10),
    "F1",
  );

  for (const t of SEMANTIC_THRESHOLDS) {
    const r = classify(results, (m) => m.cosine, t);
    console.log(
      String(t).replace(".", ",").padEnd(24),
      String(r.correctHit).padEnd(7),
      String(r.wrongHit).padEnd(7),
      String(r.falseHit).padEnd(7),
      String(r.miss).padEnd(9),
      fmt(r.precision).padEnd(10),
      fmt(r.recall).padEnd(10),
      fmt(r.f1),
    );
  }

  // Najlepszy próg dla baseline'u leksykalnego (max F1).
  let bestJaccard = null;
  for (const t of JACCARD_SWEEP) {
    const r = classify(results, (m) => m.jaccard, t);
    if (r.f1 !== null && (!bestJaccard || r.f1 > bestJaccard.r.f1)) {
      bestJaccard = { threshold: t, r };
    }
  }
  console.log(
    `Odniesienie leksykalne`.padEnd(24),
    String(bestJaccard.r.correctHit).padEnd(7),
    String(bestJaccard.r.wrongHit).padEnd(7),
    String(bestJaccard.r.falseHit).padEnd(7),
    String(bestJaccard.r.miss).padEnd(9),
    fmt(bestJaccard.r.precision).padEnd(10),
    fmt(bestJaccard.r.recall).padEnd(10),
    fmt(bestJaccard.r.f1),
  );
  console.log(
    `\n(Odniesienie leksykalne raportowane przy jego własnym najlepszym progu Jaccarda = ${bestJaccard.threshold.toFixed(2)}, wybranym przez przemiecenie 0,05-0,95 co 0,05 i maksymalizację F1 - progi kosinusowe i Jaccarda nie są bezpośrednio porównywalne liczbowo.)`,
  );

  await client.end();
}

main().catch((err) => {
  console.error("Eval failed:", err.message);
  process.exit(1);
});
