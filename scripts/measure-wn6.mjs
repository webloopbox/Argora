// Sprawdzenie wymagania WN6 (praca_pisemna.md, §4.5 i §7.7): czas odpowiedzi
// operacji niewymagających wywołania modelu poniżej 300 ms dla debaty o
// rozmiarze zbioru testowego.
//
// Mierzone są wyłącznie operacje odczytu, które nie wywołują żadnego modelu.
// Sprawdzenie duplikatu i weryfikacja strony celowo pozostają poza pomiarem,
// ponieważ obie wywołują usługę zewnętrzną, a więc nie należą do zakresu WN6.
//
// Pomiar jest lokalny: klient, aplikacja i baza działają na jednej maszynie,
// wobec czego wynik charakteryzuje aplikację, nie zaś wdrożenie sieciowe.
//
// Wymagania: uruchomione `pnpm dev:api` (port 3000) oraz kontener bazy.
//
// Uruchomienie:
//   node scripts/measure-wn6.mjs

const BASE = process.env.API_BASE ?? "http://localhost:3000";

// Debaty publiczne ze zbioru testowego: największa oraz jedna z polskich.
const LARGE = "369a6ca8-7e54-4d30-904e-d5fb5cd3bb7b"; // 50 argumentów
const MEDIUM = "8b8230e5-6b18-4b04-9c2b-39602b4bc77e"; // 22 argumenty

const TARGETS = [
  { label: "GET /debates (lista debat)", url: `${BASE}/debates` },
  { label: "GET /debates/:id (50 argumentów)", url: `${BASE}/debates/${LARGE}` },
  {
    label: "GET argumentów, debata 50 argumentów",
    url: `${BASE}/debates/${LARGE}/arguments`,
  },
  {
    label: "GET argumentów, debata 22 argumenty",
    url: `${BASE}/debates/${MEDIUM}/arguments`,
  },
];

const WARMUP = 5;
const SAMPLES = 30;
const LIMIT_MS = 300; // wartość z wymagania WN6

async function timed(url) {
  const started = performance.now();
  const res = await fetch(url);
  await res.text();
  if (!res.ok) throw new Error(`${res.status} dla ${url}`);
  return performance.now() - started;
}

function median(values) {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

const rows = [];
for (const t of TARGETS) {
  for (let i = 0; i < WARMUP; i++) await timed(t.url);
  const times = [];
  for (let i = 0; i < SAMPLES; i++) times.push(await timed(t.url));
  rows.push({
    label: t.label,
    median: median(times),
    min: Math.min(...times),
    max: Math.max(...times),
  });
}

console.log(
  `\nWN6: limit ${LIMIT_MS} ms, ${SAMPLES} pomiarów po ${WARMUP} rozgrzewkowych\n`,
);
for (const r of rows) {
  console.log(
    `${r.label.padEnd(40)} mediana ${r.median.toFixed(1).padStart(6)} ms  ` +
      `min ${r.min.toFixed(1).padStart(5)}  max ${r.max.toFixed(1).padStart(5)}  ` +
      `${r.max < LIMIT_MS ? "spełnione" : "NIESPEŁNIONE"}`,
  );
}
