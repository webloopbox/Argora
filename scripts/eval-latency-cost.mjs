// Wypełnia Tabelę 7.6 (praca_pisemna.md, §7.6): opóźnienie i koszt wywołania
// dla trzech modeli językowych z rejestru dostawcy together.ai.
//
// Mierzone są dwa zadania produkcyjne o skrajnie różnym rozmiarze wejścia:
// generowanie przesłanki oraz synteza całej debaty. Opóźnieniem jest czas od
// wysłania żądania do odebrania pełnej odpowiedzi, liczony wokół samego
// wywołania usługi. Skrypt omija warstwę HTTP aplikacji, żeby pomiar nie
// obejmował ograniczania częstotliwości z punktu 6.2.6 ani czasu odczytu z
// bazy, wspólnego dla wszystkich modeli.
//
// W odróżnieniu od pozostałych skryptów ewaluacyjnych ten nie korzysta z
// pamięci podręcznej odpowiedzi: pomiar czasu wymaga rzeczywistego wywołania,
// więc każda z zapisanych wartości pochodzi z osobnego żądania. Plik postępu
// przechowuje jedynie pomiary już wykonane, dzięki czemu przebieg przerwany
// (na przykład zerwanym połączeniem) wznawia się bez ponownego opłacania
// wywołań zakończonych powodzeniem.
//
// Materiał jest deterministyczny i wspólny z wcześniejszymi podrozdziałami.
// Punktem pomiarowym zadania generowania jest pierwszy punkt każdej z trzech
// debat z §7.4 (przesłanka popierająca tezę, bez argumentu nadrzędnego),
// a zadania syntezy - wariant "cała debata" z §7.5. Każde wywołanie powtarzane
// jest trzykrotnie, co daje dziewięć pomiarów na model i zadanie; podawana jest
// mediana, ponieważ pomiar obejmuje usługę zdalną o zmiennym obciążeniu,
// a pojedyncze pierwsze wywołanie bywa wolniejsze od kolejnych.
//
// Ograniczenie pomiaru: powtórzenia wysyłają to samo polecenie, więc ewentualne
// buforowanie po stronie dostawcy zaniżyłoby czas drugiego i trzeciego
// wywołania. Rozbicie na powtórzenia trafia do pliku wynikowego i do podsumowania
// na wyjściu, dzięki czemu da się to sprawdzić.
//
// Liczba jednostek rozliczeniowych pochodzi z pola usage odpowiedzi, którego
// implementacja produkcyjna (TogetherProvider) nie odczytuje. Cennik pobierany
// jest z katalogu modeli dostawcy w dniu pomiaru i zapisywany w pliku wynikowym
// razem ze znacznikiem czasu, żeby przeliczenie kosztu dało się odtworzyć.
// Koszt tysiąca wywołań liczony jest ze średniej liczby jednostek wejścia
// i wyjścia według stawek dla tych dwóch kierunków osobno.
//
// Wymagania: TOGETHER_API_KEY i DATABASE_URL w .env.
//
// Uruchomienie:
//   node scripts/eval-latency-cost.mjs

import pg from "pg";
import {
  computeSentiment,
  effectiveStance,
  isTransient,
  truncate,
} from "./lib/debate-model.mjs";
import { loadEnv } from "./lib/env.mjs";
import { buildSynthesisPrompt } from "./lib/synthesis-prompt.mjs";
import * as fs from "fs";

loadEnv();

const togetherKey = process.env.TOGETHER_API_KEY;
const dbUrl = process.env.DATABASE_URL;
if (!togetherKey) throw new Error("TOGETHER_API_KEY not set in .env");
if (!dbUrl) throw new Error("DATABASE_URL not set in .env");

// Te same trzy debaty polskojęzyczne, co w §7.4 i §7.5.
const DEBATES = [
  { key: "energia", id: "8b8230e5-6b18-4b04-9c2b-39602b4bc77e" },
  { key: "praca", id: "70d2279c-4614-4bd8-b5ee-19d717a7f3bf" },
  { key: "studenci", id: "9d4f85f8-723c-4bc3-9506-e103f7a261ce" },
];

// Identyfikatory jak w LlmRegistry (dostawca together.ai), nazwy jak w Tabeli 7.4.
const MODELS = [
  { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", name: "Meta Llama 3.3" },
  { id: "deepseek-ai/DeepSeek-V4-Flash-0731", name: "DeepSeek V4 Flash" },
  { id: "google/gemma-4-31B-it", name: "Google Gemma 4" },
];

const REPEATS = 3;
const GENERATE_MAX_TOKENS = 2048; // apps/api/src/ai/ai.constants.ts
const SYNTHESIS_MAX_TOKENS = 8192; // apps/api/src/ai/ai.constants.ts
const API_URL = "https://api.together.xyz/v1/chat/completions";
const CATALOG_URL = "https://api.together.xyz/v1/models";
const PAUSE_MS = 1500;

const client = new pg.Client({ connectionString: dbUrl });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Plik postępu: wyłącznie pomiary zakończone powodzeniem, klucz jednoznacznie
// wskazuje wywołanie. Usunięcie pliku wymusza pomiar od nowa.
const PROGRESS_PATH = "scripts/.eval-latency-cost-progress.json";
const progress = fs.existsSync(PROGRESS_PATH)
  ? JSON.parse(fs.readFileSync(PROGRESS_PATH, "utf8"))
  : {};

function progressSave() {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress), "utf8");
}

// ─────────────────────────────────────────────────────────────────────────────
// Kopie logiki produkcyjnej
// ─────────────────────────────────────────────────────────────────────────────

// apps/api/src/ai/prompts/generate.prompt.ts, wariant polski.
function buildGeneratePrompt({ thesis, side, parentContent }) {
  const stance = side === "pro" ? "popierający" : "obalający";
  const target = parentContent ? "powyższy argument" : "tę tezę";
  const parentCtx = parentContent
    ? `\nOdpowiadasz na istniejący argument: "${parentContent}"\n`
    : "";
  return (
    `Teza debaty: "${thesis}"\n` +
    parentCtx +
    `Sformułuj jeden zwięzły argument ${stance} ${target}. ` +
    `Zwróć WYŁĄCZNIE treść argumentu, bez wstępu, numeracji, komentarza odautorskiego ani cudzysłowów. ` +
    `Maksymalnie 3 zdania. Pisz po polsku.`
  );
}

// apps/api/src/arguments/effective-stance.ts
// ─────────────────────────────────────────────────────────────────────────────
// Wywołania usługi
// ─────────────────────────────────────────────────────────────────────────────

async function chat(modelId, prompt, maxTokens) {
  const started = Date.now();
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${togetherKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${body}`.trim());
  }
  const json = await res.json();
  const latencyMs = Date.now() - started;
  return {
    latencyMs,
    usage: json.usage ?? null,
    finishReason: json.choices?.[0]?.finish_reason ?? null,
    chars: (json.choices?.[0]?.message?.content ?? "").trim().length,
  };
}

// Ponawiane są wyłącznie błędy przejściowe (429, 5xx, awaria warstwy sieciowej).
// Zapisywany jest czas próby zakończonej powodzeniem, bo tylko ona odpowiada
// wywołaniu obsłużonemu przez usługę.
async function chatWithRetry(modelId, prompt, maxTokens) {
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await chat(modelId, prompt, maxTokens);
    } catch (err) {
      lastErr = err;
      if (!isTransient(err)) throw err;
      process.stdout.write(` [ponowienie: ${err.message.slice(0, 60)}] `);
      await sleep(3000 * (attempt + 1));
    }
  }
  throw lastErr;
}

// Cennik z katalogu modeli dostawcy. Stawki podawane są w dolarach za milion
// jednostek, osobno dla wejścia i wyjścia.
async function fetchPricing() {
  const res = await fetch(CATALOG_URL, {
    headers: { Authorization: `Bearer ${togetherKey}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`katalog modeli: ${res.status} ${body}`.trim());
  }
  const json = await res.json();
  const list = Array.isArray(json) ? json : (json.data ?? []);
  const out = {};
  for (const model of MODELS) {
    const entry = list.find((m) => m.id === model.id);
    out[model.id] = entry?.pricing ?? null;
  }
  return { fetchedAt: new Date().toISOString(), pricing: out };
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
  }

  return { key, id, thesis: dRows[0].thesis, args };
}

// ─────────────────────────────────────────────────────────────────────────────
// Statystyki
// ─────────────────────────────────────────────────────────────────────────────

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values) {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function seconds(ms) {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

function integer(n) {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}

// Koszt tysiąca wywołań ze średniego zużycia jednostek i stawek dla obu kierunków.
function costPerThousand(pricing, promptTokens, completionTokens) {
  if (!pricing) return null;
  const input = Number(pricing.input);
  const output = Number(pricing.output);
  if (!Number.isFinite(input) || !Number.isFinite(output)) return null;
  if (input === 0 && output === 0) return null;
  return (promptTokens * input + completionTokens * output) / 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Przebieg
// ─────────────────────────────────────────────────────────────────────────────

const TASKS = [
  { key: "generate", label: "generowanie", maxTokens: GENERATE_MAX_TOKENS },
  { key: "synthesis", label: "synteza", maxTokens: SYNTHESIS_MAX_TOKENS },
];

async function main() {
  await client.connect();

  // Polecenia budowane raz, wspólne dla wszystkich modeli i powtórzeń.
  const material = [];
  for (const spec of DEBATES) {
    const debate = await loadDebate(spec);
    material.push({
      key: debate.key,
      id: debate.id,
      arguments: debate.args.length,
      prompts: {
        // Pierwszy punkt pomiarowy generowania z §7.4: przesłanka popierająca
        // tezę, bez argumentu nadrzędnego.
        generate: buildGeneratePrompt({
          thesis: debate.thesis,
          side: "pro",
          parentContent: null,
        }),
        // Wariant "cała debata" z §7.5.
        synthesis: buildSynthesisPrompt(debate.thesis, debate.args),
      },
    });
  }
  await client.end();

  console.log("Materiał pomiarowy:");
  for (const m of material) {
    console.log(
      `  ${m.key.padEnd(10)} argumentów: ${String(m.arguments).padStart(2)}` +
        `, polecenie generowania: ${m.prompts.generate.length} znaków` +
        `, polecenie syntezy: ${m.prompts.synthesis.length} znaków`,
    );
  }

  const catalog = await fetchPricing();
  console.log(`\nCennik dostawcy pobrany ${catalog.fetchedAt}:`);
  for (const model of MODELS) {
    const p = catalog.pricing[model.id];
    console.log(
      `  ${model.name.padEnd(20)} ${p ? JSON.stringify(p) : "BRAK W KATALOGU"}`,
    );
  }

  const planned = MODELS.length * TASKS.length * material.length * REPEATS;
  const done = Object.keys(progress).length;
  console.log(
    `\nWywołań w planie: ${planned}, z pliku postępu: ${done}, do wykonania: ${planned - done}\n`,
  );

  const calls = [];
  for (const model of MODELS) {
    for (const task of TASKS) {
      for (const m of material) {
        for (let rep = 1; rep <= REPEATS; rep++) {
          const key = `${model.id}|${task.key}|${m.key}|${rep}`;
          if (!progress[key]) {
            const res = await chatWithRetry(
              model.id,
              m.prompts[task.key],
              task.maxTokens,
            );
            progress[key] = res;
            progressSave();
            await sleep(PAUSE_MS);
          }
          const r = progress[key];
          calls.push({
            model: model.name,
            modelId: model.id,
            task: task.key,
            debate: m.key,
            repetition: rep,
            latencyMs: r.latencyMs,
            promptTokens: r.usage?.prompt_tokens ?? null,
            completionTokens: r.usage?.completion_tokens ?? null,
            totalTokens: r.usage?.total_tokens ?? null,
            // Pole zapisywane w całości, bo cennik dostawcy przewiduje dla
            // części modeli niższą stawkę za wejście obsłużone z bufora
            // (cached_input); bez tego nie dałoby się sprawdzić, czy
            // powtórzenia tego samego polecenia były tak rozliczane.
            usage: r.usage,
            finishReason: r.finishReason,
            chars: r.chars,
          });
        }
        const group = calls.filter(
          (c) =>
            c.modelId === model.id && c.task === task.key && c.debate === m.key,
        );
        console.log(
          `  ${model.name.padEnd(20)} ${task.label.padEnd(12)} ${m.key.padEnd(10)}` +
            ` ${group.map((c) => `${c.latencyMs} ms`).join(" / ")}`,
        );
      }
    }
  }

  const raw = {
    measuredAt: new Date().toISOString(),
    repeats: REPEATS,
    pricingFetchedAt: catalog.fetchedAt,
    pricing: catalog.pricing,
    material: material.map((m) => ({
      debate: m.key,
      debateId: m.id,
      arguments: m.arguments,
      generatePromptChars: m.prompts.generate.length,
      synthesisPromptChars: m.prompts.synthesis.length,
    })),
    calls,
  };
  fs.writeFileSync(
    "scripts/eval-latency-cost-raw.json",
    JSON.stringify(raw, null, 2),
    "utf8",
  );

  writeSummary(calls, catalog);
}

function statsFor(calls, modelName, taskKey) {
  const group = calls.filter((c) => c.model === modelName && c.task === taskKey);
  const withUsage = group.filter((c) => c.totalTokens !== null);
  // Wywołania, w których dostawca zgłosił obsługę części wejścia z bufora.
  // Mediana liczona po ich wyłączeniu pokazuje, czy powtórzenia tego samego
  // polecenia zaniżyły wynik.
  const fresh = group.filter((c) => !(c.usage?.cached_tokens ?? 0));
  return {
    n: group.length,
    medianMs: median(group.map((c) => c.latencyMs)),
    minMs: Math.min(...group.map((c) => c.latencyMs)),
    maxMs: Math.max(...group.map((c) => c.latencyMs)),
    cachedInput: group.length - fresh.length,
    medianFreshMs: fresh.length ? median(fresh.map((c) => c.latencyMs)) : null,
    // Jednostki rozumowania nie trafiają do treści odpowiedzi, ale są
    // rozliczane jak wyjście; dostawca wykazuje je tylko dla części modeli.
    meanReasoning: withUsage.length
      ? mean(
          withUsage.map(
            (c) => c.usage?.completion_tokens_details?.reasoning_tokens ?? 0,
          ),
        )
      : 0,
    // Znaki dostarczonej odpowiedzi na jednostkę wyjścia. Wartość znacznie
    // poniżej długości słowa oznacza, że rozliczane wyjście jest większe od
    // tekstu, który zobaczył użytkownik.
    meanChars: group.length ? mean(group.map((c) => c.chars)) : 0,
    meanPrompt: withUsage.length
      ? mean(withUsage.map((c) => c.promptTokens))
      : 0,
    meanCompletion: withUsage.length
      ? mean(withUsage.map((c) => c.completionTokens))
      : 0,
    meanTotal: withUsage.length ? mean(withUsage.map((c) => c.totalTokens)) : 0,
    truncated: group.filter((c) => c.finishReason === "length").length,
    missingUsage: group.length - withUsage.length,
  };
}

function writeSummary(calls, catalog) {
  console.log(
    "\n═══════════════════════════════════════════════════════════\n" +
      "Tabela 7.6 - opóźnienie i koszt wywołania według modelu\n" +
      "═══════════════════════════════════════════════════════════\n",
  );

  const rows = [];
  for (const model of MODELS) {
    const gen = statsFor(calls, model.name, "generate");
    const syn = statsFor(calls, model.name, "synthesis");
    const pricing = catalog.pricing[model.id];
    const genCost = costPerThousand(pricing, gen.meanPrompt, gen.meanCompletion);
    const synCost = costPerThousand(pricing, syn.meanPrompt, syn.meanCompletion);
    const money = (v) =>
      v === null ? "brak cennika" : `${v.toFixed(2).replace(".", ",")} USD`;
    rows.push({
      model: model.name,
      gen,
      syn,
      cells: [
        model.name,
        seconds(gen.medianMs),
        seconds(syn.medianMs),
        `${integer(gen.meanTotal)} / ${integer(syn.meanTotal)}`,
        `${money(genCost)} / ${money(synCost)}`,
      ],
    });
  }

  const header = [
    "Model",
    "Opóźnienie, generowanie",
    "Opóźnienie, synteza",
    "Jednostki na wywołanie",
    "Koszt tysiąca wywołań",
  ];
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r.cells[i].length)),
  );
  const line = (cells) =>
    `| ${cells.map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
  console.log(line(header));
  console.log(`| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`);
  for (const r of rows) console.log(line(r.cells));

  console.log(
    "\nKolumny jednostek i kosztu podane jako: generowanie / synteza." +
      "\nKoszt policzony ze średniego zużycia jednostek wejścia i wyjścia" +
      `\noraz stawek pobranych ${catalog.fetchedAt}.`,
  );

  console.log("\nUzupełnienia:");
  for (const r of rows) {
    for (const [label, s] of [
      ["generowanie", r.gen],
      ["synteza    ", r.syn],
    ]) {
      console.log(
        `  ${r.model.padEnd(20)} ${label} n=${s.n}` +
          ` mediana=${s.medianMs} ms min=${s.minMs} ms max=${s.maxMs} ms` +
          ` jednostki wejście=${integer(s.meanPrompt)} wyjście=${integer(s.meanCompletion)}` +
          ` w tym rozumowanie=${integer(s.meanReasoning)}` +
          ` znaków na jednostkę wyjścia=${(s.meanChars / s.meanCompletion).toFixed(2)}` +
          ` ucięcia=${s.truncated}` +
          (s.cachedInput
            ? ` wejście z bufora=${s.cachedInput} (mediana bez nich=${s.medianFreshMs} ms)`
            : "") +
          (s.missingUsage ? ` bez licznika=${s.missingUsage}` : ""),
      );
    }
  }

  console.log(
    "\nRozbicie na powtórzenia (kontrola buforowania po stronie dostawcy):",
  );
  for (const model of MODELS) {
    for (const task of TASKS) {
      for (let rep = 1; rep <= REPEATS; rep++) {
        const group = calls.filter(
          (c) =>
            c.model === model.name &&
            c.task === task.key &&
            c.repetition === rep,
        );
        if (!group.length) continue;
        console.log(
          `  ${model.name.padEnd(20)} ${task.label.padEnd(12)} powtórzenie ${rep}:` +
            ` mediana=${median(group.map((c) => c.latencyMs))} ms`,
        );
      }
    }
  }

  console.log("\nZapisano scripts/eval-latency-cost-raw.json");
}

main().catch(async (err) => {
  progressSave();
  console.error("\nEval failed:", err.message);
  console.error(
    "Postęp zapisano w",
    PROGRESS_PATH,
    "- wznów tym samym poleceniem.",
  );
  await client.end().catch(() => {});
  process.exit(1);
});
