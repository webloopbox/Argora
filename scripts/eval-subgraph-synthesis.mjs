// Wypełnia Tabelę 7.5 (praca_pisemna.md, §7.5): porównanie syntezy podgrafu
// z syntezą całej debaty, na trzech debatach polskojęzycznych.
//
// Skrypt sam nie rozstrzyga o wynikach. Wykonuje sześć wywołań syntezy
// (podgraf i cała debata dla każdej z trzech debat), a następnie przygotowuje
// propozycję oceny trzech wielkości z tabeli 7.5 (kompletność, skupienie,
// zdania bez pokrycia w materiale), opartą na podobieństwie reprezentacji
// wektorowych. Plik eval-subgraph-synthesis-review.md jest arkuszem
// weryfikacyjnym: każdemu dopasowaniu towarzyszy w nim wartość podobieństwa
// oraz pełna treść obu porównywanych fragmentów, dzięki czemu każdy wiersz da
// się sprawdzić ręcznie. Tabela 7.5 podaje wartości automatyczne, a §7.5
// omawia wprost ograniczenia takiego sposobu oceny.
//
// Materiał wyznaczany jest regułą deterministyczną: badaną gałęzią jest
// poddrzewo tego argumentu podpiętego bezpośrednio pod tezę, które ma
// najwięcej potomków (przy równej liczbie decyduje wcześniejszy czas
// utworzenia). Powtórne uruchomienie operuje więc na tym samym materiale.
//
// Polecenie kierowane do modelu jest kopią polskiego wariantu z
// apps/api/src/ai/prompts/synthesis.prompt.ts, a wagi, sentyment i polaryzacja
// efektywna liczone są tak jak w apps/api/src/arguments/arguments.service.ts
// oraz effective-stance.ts. Skrypt omija warstwę HTTP aplikacji, żeby pomiar
// czasu nie obejmował ograniczania częstotliwości z punktu 6.2.6.
//
// Wymagania: TOGETHER_API_KEY, GEMINI_API_KEY i DATABASE_URL w .env.
//
// Uruchomienie:
//   node scripts/eval-subgraph-synthesis.mjs

import { GoogleGenAI } from "@google/genai";
import pg from "pg";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    process.env[parts[0].trim()] = parts
      .slice(1)
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
}

const togetherKey = process.env.TOGETHER_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!togetherKey) throw new Error("TOGETHER_API_KEY not set in .env");
if (!geminiKey) throw new Error("GEMINI_API_KEY not set in .env");
if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

// Te same trzy debaty polskojęzyczne, co w §7.4.
const DEBATES = [
  { key: "energia", id: "8b8230e5-6b18-4b04-9c2b-39602b4bc77e" },
  { key: "praca", id: "70d2279c-4614-4bd8-b5ee-19d717a7f3bf" },
  { key: "studenci", id: "9d4f85f8-723c-4bc3-9506-e103f7a261ce" },
];

// Obie syntezy w parze wykonuje ten sam model, żeby porównanie dotyczyło
// zakresu wejścia, a nie doboru modelu.
const MODEL = {
  id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  name: "Meta Llama 3.3",
};

const SYNTHESIS_MAX_TOKENS = 8192; // apps/api/src/ai/ai.constants.ts
const CONTROVERSY_MAX_RATIO = 0.2; // apps/api/src/arguments/arguments.service.ts
const PARENT_PREVIEW_MAX = 140; // apps/api/src/ai/prompts/synthesis.prompt.ts
const API_URL = "https://api.together.xyz/v1/chat/completions";
const EMBED_MODEL = "gemini-embedding-001"; // jak w produkcji

// Progi służą wyłącznie do zaproponowania oceny autorowi. Zdanie o podobieństwie
// poniżej MATCH_LOW nie jest przypisywane do żadnego argumentu i trafia na listę
// kandydatów na twierdzenia bez pokrycia w materiale.
const MATCH_COVERED = 0.6;
const MATCH_LOW = 0.45;

const ai = new GoogleGenAI({ apiKey: geminiKey });
const client = new pg.Client({ connectionString: dbUrl });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CACHE_PATH = "scripts/.eval-subgraph-synthesis-cache.json";
const cache = fs.existsSync(CACHE_PATH)
  ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"))
  : {};

function cacheKey(...parts) {
  return crypto.createHash("sha1").update(parts.join(" ")).digest("hex");
}

function cacheSave() {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache), "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Kopie logiki produkcyjnej
// ─────────────────────────────────────────────────────────────────────────────

function effectiveStance(startId, byId) {
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

function computeSentiment(forCount, againstCount) {
  const weight = forCount + againstCount;
  if (weight === 0) return "neutral";
  const balanceRatio = Math.abs(forCount - againstCount) / weight;
  if (balanceRatio < CONTROVERSY_MAX_RATIO) return "controversy";
  return forCount >= againstCount ? "pro" : "against";
}

function truncate(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

const SIDE_LABEL = { pro: "ZA TEZĄ", against: "PRZECIW TEZIE" };
const SENTIMENT_LABEL = {
  pro: "przewaga głosów za",
  against: "przewaga głosów przeciw",
  controversy: "sporny (głosy podzielone)",
  neutral: "brak głosów",
};

// Kopia polskiego wariantu buildSynthesisPrompt.
function buildSynthesisPrompt(thesis, args) {
  const entries = args
    .map((arg, idx) => {
      const stance = SIDE_LABEL[arg.effectiveStance] ?? arg.effectiveStance;
      const sentiment = SENTIMENT_LABEL[arg.sentiment] ?? arg.sentiment;
      const replyLine = arg.parentContent
        ? `\n   W odpowiedzi na (${arg.side !== "against" ? "zgadza się z" : "polemizuje z"}): ` +
          `"${truncate(arg.parentContent, PARENT_PREVIEW_MAX)}"`
        : "";
      return (
        `${idx + 1}. [${stance}] ${arg.author} - "${arg.content}"` +
        replyLine +
        `\n   Głosy: ${arg.forCount} za, ${arg.againstCount} przeciw ` +
        `(waga ${arg.weight}, sentyment: ${sentiment})`
      );
    })
    .join("\n\n");

  const checklist = (stance) =>
    args
      .filter((arg) => arg.effectiveStance === stance)
      .map((arg) => `${arg.author} (waga ${arg.weight})`)
      .join(", ") || "(brak)";

  return (
    `Teza debaty: "${thesis}"\n\n` +
    `Wymiana argumentów w zaznaczonej części dyskusji (liczba argumentów: ${args.length}):\n\n` +
    `${entries}\n\n` +
    "Znacznik w nawiasie kwadratowym przy każdym wpisie podaje już jego ostateczne " +
    "stanowisko wobec tezy (wyznaczone przez cały łańcuch odpowiedzi, a nie tylko " +
    "przez bezpośredniego rodzica). Traktuj go jako wiążący.\n\n" +
    "Lista kontrolna pokrycia. Każde nazwisko z poniższej listy musi pojawić się, pod " +
    "własnym nazwiskiem autora, we właściwej sekcji i tylko tam. Dwa różne wpisy mogą " +
    "przypadkiem mieć tego samego autora albo tę samą wagę, co NIE czyni ich tym samym " +
    "argumentem. Nigdy nie łącz dwóch różnych autorów w jedną wzmiankę, nigdy nie " +
    "przypisuj treści jednego autora do nazwiska innego i nigdy nie pomijaj po cichu " +
    "nazwiska z tej listy:\n" +
    `  ZA tezą: ${checklist("pro")}\n` +
    `  PRZECIW tezie: ${checklist("against")}\n\n` +
    "Zadanie: napisz rozbudowane streszczenie tego kontekstu po polsku, sformatowane jako Markdown.\n\n" +
    'Użyj dokładnie tych pięciu nagłówków sekcji, każdy zapisany dosłownie jako nagłówek ' +
    'Markdown trzeciego poziomu ("### " i zaraz po nim dokładny tytuł podany niżej, w ' +
    "osobnym wierszu). Nie zastępuj nagłówka pogrubieniem, nie dodawaj, nie usuwaj, nie " +
    "zmieniaj kolejności ani nie przeformułowuj tytułów:\n\n" +
    "### O co toczy się spór\n" +
    "1-2 zdania o tym, czego dotyczy zaznaczona część dyskusji.\n\n" +
    "### Argumenty za\n" +
    'Uwzględnij każdego autora z powyższej listy "ZA tezą", co najmniej jedną frazą na ' +
    'osobę, odwołując się do autora i wagi głosów (np. "Anna K. (waga 6) zwraca uwagę, ' +
    "że…\"). Pisz zwięźle, ale długość ma wynikać z rozmiaru listy kontrolnej. Nie skracaj " +
    "przez pominięcie nazwiska.\n\n" +
    "### Argumenty przeciw\n" +
    'Analogicznie uwzględnij każdego autora z powyższej listy "PRZECIW tezie".\n\n' +
    "### Linie sporu\n" +
    'Wskaż główne punkty tarcia, w tym argumenty oznaczone jako "sporny". 1-2 zdania.\n\n' +
    "### Punkty wspólne i pytania otwarte\n" +
    "Jeśli uczestnicy się w czymś zgadzają, wskaż to. Jeśli nie, sformułuj 1-2 pytania " +
    "otwarte wynikające z dyskusji. 1-2 zdania.\n\n" +
    "Pisz konkretnie, unikaj ogólników. Odwołuj się do treści argumentów, nie powtarzaj " +
    "ich dosłownie 1:1."
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Wywołania usług zewnętrznych
// ─────────────────────────────────────────────────────────────────────────────

async function chat(prompt, maxTokens) {
  const started = Date.now();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${togetherKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL.id,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body}`.trim());
  }
  const json = await res.json();
  return {
    text: (json.choices?.[0]?.message?.content ?? "").trim(),
    finishReason: json.choices?.[0]?.finish_reason ?? null,
    // Zbierane na potrzeby §7.6; implementacja produkcyjna pole to pomija.
    usage: json.usage ?? null,
    latencyMs: Date.now() - started,
  };
}

function isTransient(err) {
  const status = /^(\d{3})/.exec(err.message)?.[1];
  if (!status) return true;
  return status === "429" || status.startsWith("5");
}

async function chatWithRetry(prompt, maxTokens) {
  const key = cacheKey(MODEL.id, String(maxTokens), prompt);
  if (cache[key]) return cache[key];

  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = await chat(prompt, maxTokens);
      cache[key] = result;
      cacheSave();
      return result;
    } catch (err) {
      lastErr = err;
      if (!isTransient(err)) throw err;
      await sleep(2000 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function embed(text) {
  const key = cacheKey("embed", EMBED_MODEL, text);
  if (cache[key]) return cache[key];
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: text,
      });
      const vec = res.embeddings?.[0]?.values ?? [];
      cache[key] = vec;
      cacheSave();
      return vec;
    } catch (err) {
      if (attempt === 4) throw err;
      await sleep(2000 * (attempt + 1));
    }
  }
  return [];
}

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

// ─────────────────────────────────────────────────────────────────────────────
// Materiał pomiarowy
// ─────────────────────────────────────────────────────────────────────────────

async function loadDebate({ key, id }) {
  const { rows: dRows } = await client.query(
    `SELECT thesis FROM debates WHERE id = $1`,
    [id],
  );
  const { rows } = await client.query(
    `SELECT a.id, a.content, a.side, a.parent_argument_id, a.created_at,
            u.display_name AS author,
            COUNT(*) FILTER (WHERE v.value = 1 AND v.archived_on IS NULL)  AS for_count,
            COUNT(*) FILTER (WHERE v.value = -1 AND v.archived_on IS NULL) AS against_count
       FROM arguments a
       JOIN users u ON u.id = a.author_id
       LEFT JOIN votes v ON v.argument_id = a.id
      WHERE a.debate_id = $1 AND a.archived_on IS NULL
      GROUP BY a.id, u.display_name
      ORDER BY a.created_at, a.id`,
    [id],
  );

  const args = rows.map((r) => ({
    id: r.id,
    content: r.content,
    side: r.side,
    parentArgumentId: r.parent_argument_id,
    author: r.author,
    forCount: Number(r.for_count),
    againstCount: Number(r.against_count),
  }));

  const byId = new Map(args.map((a) => [a.id, a]));
  for (const a of args) {
    a.weight = a.forCount + a.againstCount;
    a.sentiment = computeSentiment(a.forCount, a.againstCount);
    a.effectiveStance = effectiveStance(a.id, byId);
    a.parentContent = a.parentArgumentId
      ? (byId.get(a.parentArgumentId)?.content ?? null)
      : null;
    a.depth = (() => {
      let d = 1,
        cur = a.parentArgumentId;
      while (cur && d < 20) {
        d++;
        cur = byId.get(cur)?.parentArgumentId ?? null;
      }
      return d;
    })();
  }

  return { key, id, thesis: dRows[0].thesis, args, byId };
}

// Badana gałąź: poddrzewo argumentu podpiętego pod tezę o największej liczbie
// potomków. Reguła deterministyczna, przy remisie decyduje kolejność utworzenia.
function selectBranch(debate) {
  const children = new Map();
  for (const a of debate.args) {
    const p = a.parentArgumentId;
    if (!p) continue;
    if (!children.has(p)) children.set(p, []);
    children.get(p).push(a);
  }
  const subtree = (root) => {
    const out = [root];
    const stack = [root];
    while (stack.length) {
      const node = stack.pop();
      for (const ch of children.get(node.id) ?? []) {
        out.push(ch);
        stack.push(ch);
      }
    }
    return out;
  };

  const roots = debate.args.filter((a) => !a.parentArgumentId);
  let best = null;
  for (const r of roots) {
    const nodes = subtree(r);
    if (!best || nodes.length > best.nodes.length) best = { root: r, nodes };
  }
  // Kolejność jak w produkcji: listForDebate sortuje rosnąco po czasie utworzenia.
  const order = new Map(debate.args.map((a, i) => [a.id, i]));
  best.nodes.sort((x, y) => order.get(x.id) - order.get(y.id));
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rozbiór streszczenia i propozycja oceny
// ─────────────────────────────────────────────────────────────────────────────

function splitSentences(markdown) {
  const out = [];
  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const body = line.replace(/^[-*\d.\s]+/, "").trim();
    if (!body) continue;
    for (const piece of body.split(/(?<=[.!?])\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ])/)) {
      const s = piece.trim();
      if (s.length >= 25) out.push(s);
    }
  }
  return out;
}

async function assess(summaryText, branchIds, allArgs) {
  const sentences = splitSentences(summaryText);
  const sentVecs = [];
  for (const s of sentences) sentVecs.push(await embed(s));

  const argVecs = new Map();
  for (const a of allArgs) argVecs.set(a.id, await embed(a.content));

  // Pokrycie: dla każdego argumentu gałęzi najlepiej pasujące zdanie streszczenia.
  const coverage = [];
  for (const a of allArgs) {
    if (!branchIds.has(a.id)) continue;
    let best = { sim: -1, sentence: null };
    sentVecs.forEach((v, i) => {
      const sim = cosineSimilarity(argVecs.get(a.id), v);
      if (sim > best.sim) best = { sim, sentence: sentences[i] };
    });
    coverage.push({
      argumentId: a.id,
      author: a.author,
      content: a.content,
      bestSimilarity: Number(best.sim.toFixed(3)),
      bestSentence: best.sentence,
      proposedCovered: best.sim >= MATCH_COVERED,
    });
  }

  // Skupienie i kandydaci na konfabulacje: dla każdego zdania najbliższy argument.
  // Uwaga przy odczycie: w wariancie podgrafu model nie dostaje argumentów spoza
  // gałęzi, więc wysokie skupienie jest przesądzone zakresem wejścia i służy jako
  // kontrola implementacji. Porównanie niosą wartości dla całej debaty (§7.5).
  const sentenceMap = sentences.map((s, i) => {
    let bestIn = { sim: -1, id: null },
      bestOut = { sim: -1, id: null };
    for (const a of allArgs) {
      const sim = cosineSimilarity(sentVecs[i], argVecs.get(a.id));
      const target = branchIds.has(a.id) ? "in" : "out";
      if (target === "in" && sim > bestIn.sim) bestIn = { sim, id: a.id };
      if (target === "out" && sim > bestOut.sim) bestOut = { sim, id: a.id };
    }
    const bestOverall = Math.max(bestIn.sim, bestOut.sim);
    const describe = (id) => {
      const a = allArgs.find((x) => x.id === id);
      return a ? { author: a.author, content: a.content } : null;
    };
    return {
      sentence: s,
      simInsideBranch: Number(bestIn.sim.toFixed(3)),
      simOutsideBranch: Number(bestOut.sim.toFixed(3)),
      // Argumenty, które dały te dwie wartości. Bez nich wiersz arkusza nie
      // daje się zweryfikować ręcznie: autor widzi liczbę, ale nie wie, z
      // czym zdanie zostało porównane.
      nearestInsideBranch: describe(bestIn.id),
      nearestOutsideBranch: describe(bestOut.id),
      proposedOutsideBranch: bestOut.sim > bestIn.sim,
      proposedUnsupported: bestOverall < MATCH_LOW,
    };
  });

  return { sentences: sentenceMap, coverage };
}

// ─────────────────────────────────────────────────────────────────────────────
// Przebieg
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  await client.connect();
  const results = [];

  for (const spec of DEBATES) {
    const debate = await loadDebate(spec);
    const branch = selectBranch(debate);
    const branchIds = new Set(branch.nodes.map((n) => n.id));

    process.stdout.write(
      `\n${debate.key}: gałąź "${truncate(branch.root.content, 60)}" ` +
        `(${branch.nodes.length} z ${debate.args.length} argumentów)\n`,
    );

    const variants = [
      { kind: "subgraph", args: branch.nodes },
      { kind: "whole", args: debate.args },
    ];

    const perVariant = [];
    for (const v of variants) {
      const prompt = buildSynthesisPrompt(debate.thesis, v.args);
      const res = await chatWithRetry(prompt, SYNTHESIS_MAX_TOKENS);
      process.stdout.write(
        `  ${v.kind}: ${res.text.length} znaków, ${res.latencyMs} ms, ` +
          `finish=${res.finishReason}\n`,
      );
      const scored = await assess(res.text, branchIds, debate.args);
      perVariant.push({
        kind: v.kind,
        inputArguments: v.args.length,
        promptChars: prompt.length,
        latencyMs: res.latencyMs,
        usage: res.usage,
        finishReason: res.finishReason,
        text: res.text,
        ...scored,
      });
    }

    results.push({
      debate: debate.key,
      debateId: debate.id,
      thesis: debate.thesis,
      branchRootId: branch.root.id,
      branchRootContent: branch.root.content,
      branchSize: branch.nodes.length,
      debateSize: debate.args.length,
      variants: perVariant,
    });
  }

  await client.end();
  cacheSave();

  fs.writeFileSync(
    "scripts/eval-subgraph-synthesis-raw.json",
    JSON.stringify(results, null, 2),
    "utf8",
  );

  writeReview(results);
  writeSummary(results);
}

function pct(n, d) {
  return d === 0 ? "-" : `${((100 * n) / d).toFixed(0)}%`;
}

function writeSummary(results) {
  console.log(
    "\n═══════════════════════════════════════════════════════════\n" +
      "Propozycja do Tabeli 7.5 (wymaga weryfikacji autora)\n" +
      "═══════════════════════════════════════════════════════════\n",
  );
  const agg = { subgraph: [], whole: [] };
  for (const r of results)
    for (const v of r.variants) agg[v.kind].push({ r, v });

  const line = (label, fn) =>
    console.log(
      `${label.padEnd(42)} ${String(fn("subgraph")).padEnd(18)} ${fn("whole")}`,
    );

  line("Wielkość", (k) => (k === "subgraph" ? "Podgraf" : "Cała debata"));
  line("Argumenty przekazane modelowi", (k) =>
    agg[k].reduce((sum, x) => sum + x.v.inputArguments, 0),
  );
  line("Argumenty gałęzi uwzględnione", (k) => {
    const cov = agg[k].flatMap((x) => x.v.coverage);
    return `${cov.filter((c) => c.proposedCovered).length}/${cov.length} (${pct(cov.filter((c) => c.proposedCovered).length, cov.length)})`;
  });
  line("Zdania streszczenia", (k) =>
    agg[k].reduce((sum, x) => sum + x.v.sentences.length, 0),
  );
  line("Zdania dotyczące badanej gałęzi", (k) => {
    const s = agg[k].flatMap((x) => x.v.sentences);
    const inside = s.filter((x) => !x.proposedOutsideBranch).length;
    return `${inside}/${s.length} (${pct(inside, s.length)})`;
  });
  line("Kandydaci na twierdzenia bez pokrycia", (k) => {
    const s = agg[k].flatMap((x) => x.v.sentences);
    return `${s.filter((x) => x.proposedUnsupported).length}/${s.length}`;
  });
  line("Jednostki rozliczeniowe, średnia na wywołanie", (k) =>
    Math.round(
      agg[k].reduce((sum, x) => sum + (x.v.usage?.total_tokens ?? 0), 0) /
        agg[k].length,
    ),
  );
  line("Mediana opóźnienia syntezy [ms]", (k) => {
    const v = agg[k].map((x) => x.v.latencyMs).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  });

  console.log(
    "\nArkusz weryfikacyjny: scripts/eval-subgraph-synthesis-review.md" +
      "\nDane surowe:          scripts/eval-subgraph-synthesis-raw.json",
  );
}

function writeReview(results) {
  const out = [];
  out.push("# Arkusz weryfikacyjny do §7.5\n");
  out.push(
    "Wartości poniżej są **propozycją narzędzia**, nie wynikiem. Dla każdej pozycji " +
      "podano podobieństwo kosinusowe oraz oba porównywane fragmenty, żeby ocenę można " +
      "było potwierdzić albo skorygować ręcznie. Kolumna decyzji jest do wypełnienia " +
      "przez autora pracy.\n",
  );
  out.push(
    `Model syntezy: ${MODEL.name} (${MODEL.id}). Progi propozycji: pokrycie ≥ ${MATCH_COVERED}, ` +
      `brak pokrycia w materiale < ${MATCH_LOW}.\n`,
  );

  out.push(
    "## Jak czytać tabele\n\n" +
      "**Pokrycie argumentów badanej gałęzi.** Dla każdego argumentu gałęzi wskazano zdanie " +
      "streszczenia najbardziej do niego podobne. Pytanie do rozstrzygnięcia: czy to zdanie " +
      "rzeczywiście oddaje treść argumentu.\n\n" +
      "**Zdania streszczenia.** Każde zdanie porównano osobno z argumentami badanej gałęzi " +
      "oraz z argumentami spoza niej, a w tabeli podano najbliższy argument z każdej z tych " +
      "dwóch grup. Etykieta `spoza gałęzi` znaczy tylko tyle, że zdanie okazało się bliższe " +
      "argumentowi spoza gałęzi niż któremukolwiek argumentowi gałęzi; sama w sobie nie " +
      "oznacza błędu. Pytanie do rozstrzygnięcia brzmi: czy zdanie relacjonuje treść " +
      "wskazanego argumentu spoza gałęzi. Zdania ramowe, to jest przypomnienie tezy albo " +
      "zapowiedź układu streszczenia, nie relacjonują żadnego argumentu i należy je oznaczyć " +
      "jako `ramowe`. Etykieta `BEZ POKRYCIA` wskazuje kandydata na twierdzenie niepoparte " +
      "materiałem debaty.\n\n" +
      "**Kolumna decyzji.** Wypełniać wyłącznie przy sprzeciwie wobec propozycji: `nie` przy " +
      "niesłusznie uznanym pokryciu, `ramowe` przy zdaniu bez treści merytorycznej, `z gałęzi` " +
      "albo `spoza gałęzi` przy błędnym przypisaniu. Wiersz pozostawiony pusty liczy się jako " +
      "zgoda z propozycją.\n",
  );

  for (const r of results) {
    out.push(`\n---\n\n## Debata: ${r.debate}\n`);
    out.push(`**Teza:** ${r.thesis}\n`);
    out.push(
      `**Badana gałąź:** ${r.branchSize} z ${r.debateSize} argumentów, korzeń: "${r.branchRootContent}"\n`,
    );

    for (const v of r.variants) {
      const label = v.kind === "subgraph" ? "Synteza podgrafu" : "Synteza całej debaty";
      out.push(`\n### ${label}\n`);
      out.push(
        `Argumentów na wejściu: ${v.inputArguments}. Opóźnienie: ${v.latencyMs} ms. ` +
          `Jednostki: ${v.usage?.prompt_tokens ?? "?"} wejście / ${v.usage?.completion_tokens ?? "?"} wyjście.\n`,
      );

      out.push("\n#### Pokrycie argumentów badanej gałęzi\n");
      out.push("| Argument (autor) | Podobieństwo | Najlepiej pasujące zdanie | Propozycja | Decyzja autora |");
      out.push("| --- | --- | --- | --- | --- |");
      for (const c of v.coverage) {
        out.push(
          `| ${c.author}: ${truncate(c.content, 90).replace(/\|/g, "/")} | ${c.bestSimilarity} | ` +
            `${truncate(c.bestSentence ?? "-", 110).replace(/\|/g, "/")} | ` +
            `${c.proposedCovered ? "pokryty" : "NIEPOKRYTY"} |  |`,
        );
      }

      out.push("\n#### Zdania streszczenia\n");
      out.push(
        "| Zdanie | Najbliższy argument gałęzi | Podob. | Najbliższy argument spoza gałęzi | Podob. | Propozycja | Decyzja autora |",
      );
      out.push("| --- | --- | --- | --- | --- | --- | --- |");
      for (const s of v.sentences) {
        const proposal = s.proposedUnsupported
          ? "BEZ POKRYCIA"
          : s.proposedOutsideBranch
            ? "spoza gałęzi"
            : "z gałęzi";
        const inside = s.nearestInsideBranch
          ? `${s.nearestInsideBranch.author}: ${truncate(s.nearestInsideBranch.content, 90)}`
          : "-";
        const outside = s.nearestOutsideBranch
          ? `${s.nearestOutsideBranch.author}: ${truncate(s.nearestOutsideBranch.content, 90)}`
          : "-";
        out.push(
          `| ${truncate(s.sentence, 130).replace(/\|/g, "/")} | ` +
            `${inside.replace(/\|/g, "/")} | ${s.simInsideBranch} | ` +
            `${outside.replace(/\|/g, "/")} | ${s.simOutsideBranch} | ${proposal} |  |`,
        );
      }

      out.push("\n<details><summary>Pełna treść streszczenia</summary>\n");
      out.push("```markdown");
      out.push(v.text);
      out.push("```\n</details>\n");
    }
  }

  fs.writeFileSync(
    "scripts/eval-subgraph-synthesis-review.md",
    out.join("\n"),
    "utf8",
  );
}

main().catch((err) => {
  console.error("Eval failed:", err.message);
  cacheSave();
  client.end().catch(() => {});
  process.exit(1);
});
