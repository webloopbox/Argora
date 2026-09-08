// Seeds a public, Polish-language debate with a 4-level argument tree.
// Topic: czy praca zdalna powinna być domyślnym modelem zatrudnienia w IT.
//
// Built for rozdział 7 (ocena modeli): each reply directly rebuts or
// supports its parent's specific claim, not just the thesis in general, so
// that a "classify side" call on a deep node genuinely requires walking the
// parent chain rather than pattern-matching keywords from the thesis.
//
// Requirements:
//   - API running (pnpm dev:api)
//   - Node 18+
//
// Execution:
//   pnpm seed:remote:pl

import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Parse .env manually
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split("=");
    const key = parts[0].trim();
    const val = parts
      .slice(1)
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    process.env[key] = val;
  }
}
const API = process.env.API_URL ?? "http://localhost:3000";
const WEB = process.env.WEB_URL ?? "http://localhost:5173";
const PASSWORD = "haslo1234";

const owner = {
  displayName: "Marek Demo",
  email: "demo-owner@brainstorm.test",
};

const voters = [
  { displayName: "Anna Kowalska", email: "anna.kowalska@brainstorm.test" },
  { displayName: "Jan Nowak", email: "jan.nowak@brainstorm.test" },
  {
    displayName: "Maria Wiśniewska",
    email: "maria.wisniewska@brainstorm.test",
  },
  { displayName: "Piotr Wójcik", email: "piotr.wojcik@brainstorm.test" },
  {
    displayName: "Katarzyna Kowalczyk",
    email: "katarzyna.kowalczyk@brainstorm.test",
  },
  { displayName: "Tomasz Kamiński", email: "tomasz.kaminski@brainstorm.test" },
  {
    displayName: "Magdalena Lewandowska",
    email: "magdalena.lewandowska@brainstorm.test",
  },
  {
    displayName: "Krzysztof Zieliński",
    email: "krzysztof.zielinski@brainstorm.test",
  },
];

// 4-poziomowe drzewo, 20 węzłów. Każda gałąź to spójny ciąg: teza -> zarzut
// -> obrona -> kontra wobec obrony, więc odpowiedź na węźle L3/L4 ma sens
// tylko w kontekście konkretnego rodzica, nie samej tezy.
const tree = [
  // ─── L1 (bezpośrednio pod tezą) ──────────────────────────────────────────
  {
    key: "MAIN",
    parent: null,
    side: "pro",
    author: 0,
    votes: 8,
    content:
      "Praca zdalna zwiększa produktywność programistów, ponieważ eliminuje przerywniki charakterystyczne dla open space'ów i pozwala pracować w głębokim skupieniu.",
  },
  {
    key: "L1.B",
    parent: null,
    side: "pro",
    author: 1,
    votes: 6,
    content:
      "Model zdalny otwiera dostęp do globalnego rynku talentów, dzięki czemu firmy IT nie są ograniczone lokalnym rynkiem pracy.",
  },
  {
    key: "L1.C",
    parent: null,
    side: "against",
    author: 2,
    votes: 6,
    content:
      "Praca zdalna osłabia budowanie kultury organizacyjnej i utrudnia wdrażanie nowych, mniej doświadczonych pracowników.",
  },
  {
    key: "L1.D",
    parent: null,
    side: "against",
    author: 3,
    votes: 5,
    content:
      "Bez fizycznej obecności trudniej o spontaniczną wymianę wiedzy między zespołami, co spowalnia rozwiązywanie problemów międzyzespołowych.",
  },
  {
    key: "L1.E",
    parent: null,
    side: "pro",
    author: 4,
    votes: 5,
    content:
      "Zniesienie dojazdów realnie zwiększa czas dostępny na pracę głęboką i regenerację, co przekłada się na mniejszą rotację kadr.",
  },
  {
    key: "L1.F",
    parent: null,
    side: "against",
    author: 5,
    votes: 4,
    content:
      "Zdalna rekrutacja utrudnia ocenę dopasowania kulturowego kandydata, co zwiększa ryzyko kosztownych błędów rekrutacyjnych.",
  },

  // ─── L2 (odpowiedzi na L1) ───────────────────────────────────────────────
  {
    key: "L2.MAIN.contra",
    parent: "MAIN",
    side: "against",
    author: 6,
    votes: 4,
    content:
      "Głębokie skupienie w domu bywa iluzoryczne - bez rytmu biura część pracowników traci strukturę dnia i efektywnie pracuje mniej godzin.",
  },
  {
    key: "L2.MAIN.support",
    parent: "MAIN",
    side: "pro",
    author: 7,
    votes: 4,
    content:
      "Narzędzia do pracy asynchronicznej, takie jak nagrane demo i wspólna dokumentacja decyzji, w praktyce eliminują przerywniki lepiej niż jakiekolwiek biuro.",
  },
  {
    key: "L2.B.contra",
    parent: "L1.B",
    side: "against",
    author: 0,
    votes: 4,
    content:
      "Globalna rekrutacja oznacza też globalną konkurencję płacową, która w dłuższej perspektywie obniża stawki lokalnych specjalistów.",
  },
  {
    key: "L2.C.support",
    parent: "L1.C",
    side: "against",
    author: 1,
    votes: 4,
    content:
      "Kulturę organizacyjną da się budować rytuałami zdalnymi, takimi jak regularne retrospektywy i jawna dokumentacja decyzji, niezależnie od lokalizacji zespołu.",
  },
  {
    key: "L2.D.support",
    parent: "L1.D",
    side: "against",
    author: 2,
    votes: 3,
    content:
      "Współczesne narzędzia, takie jak wspólne tablice i sesje pair-programming online, skutecznie zastępują spontaniczne rozmowy przy biurku.",
  },
  {
    key: "L2.E.contra",
    parent: "L1.E",
    side: "against",
    author: 3,
    votes: 3,
    content:
      "Zniesienie dojazdów bywa równoważone przez zacieranie granicy między pracą a domem, co zwiększa ryzyko wypalenia zawodowego.",
  },
  {
    key: "L2.F.support",
    parent: "L1.F",
    side: "against",
    author: 4,
    votes: 3,
    content:
      "Ustrukturyzowane rozmowy rekrutacyjne i próbki pracy oceniają dopasowanie skuteczniej niż subiektywne wrażenie z rozmowy w biurze.",
  },

  // ─── L3 (odpowiedzi na L2) ───────────────────────────────────────────────
  {
    key: "L3.MAIN.contra.rebut",
    parent: "L2.MAIN.contra",
    side: "against",
    author: 5,
    votes: 3,
    content:
      "Problem struktury dnia rozwiązują jasne zasady zespołu, takie jak wspólne godziny dostępności, a nie fizyczna obecność w biurze.",
  },
  {
    key: "L3.MAIN.support.rebut",
    parent: "L2.MAIN.support",
    side: "against",
    author: 6,
    votes: 3,
    content:
      "Dokumentacja nie zastępuje szybkiej, nieplanowanej konsultacji, która w biurze trwa dwie minuty, a zdalnie wymaga umówienia osobnej rozmowy.",
  },
  {
    key: "L3.B.contra.rebut",
    parent: "L2.B.contra",
    side: "against",
    author: 7,
    votes: 2,
    content:
      "Presja płacowa dotyczy głównie ról juniorskich - specjalistów o unikalnych kompetencjach globalny rynek premiuje wyższymi, nie niższymi stawkami.",
  },
  {
    key: "L3.E.contra.rebut",
    parent: "L2.E.contra",
    side: "against",
    author: 0,
    votes: 2,
    content:
      "Wypalenie wynika z braku granic organizacyjnych, nie z samej zdalności - firmy z jasną polityką braku spotkań po godzinach nie notują jego wzrostu.",
  },
  {
    key: "L3.F.support.rebut",
    parent: "L2.F.support",
    side: "against",
    author: 1,
    votes: 2,
    content:
      "Próbki pracy oceniają kompetencje techniczne, ale nie przewidują, jak kandydat radzi sobie z presją w realnej, nieprzewidywalnej sytuacji zespołowej.",
  },

  // ─── L4 (odpowiedzi na L3) ───────────────────────────────────────────────
  {
    key: "L4.MAIN.deepest",
    parent: "L3.MAIN.contra.rebut",
    side: "against",
    author: 2,
    votes: 2,
    content:
      "Wspólne godziny dostępności rozwiązują problem szybkiego kontaktu, ale nie odtwarzają nieformalnego uczenia się przez obserwację pracy bardziej doświadczonych kolegów.",
  },
  {
    key: "L4.B.deepest",
    parent: "L3.B.contra.rebut",
    side: "against",
    author: 3,
    votes: 2,
    content:
      "Nawet unikalni specjaliści z czasem stają się zastępowalni, gdy firma zbuduje wystarczająco dużą globalną pulę kandydatów o podobnym profilu.",
  },
];

async function jsonFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(
      `${opts.method ?? "GET"} ${path} → ${res.status}: ${text}`,
    );
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

async function registerOrLogin(user) {
  try {
    return await jsonFetch("/auth/register", {
      method: "POST",
      body: { ...user, password: PASSWORD },
    });
  } catch (err) {
    if (err.status === 409) {
      return jsonFetch("/auth/login", {
        method: "POST",
        body: { email: user.email, password: PASSWORD },
      });
    }
    throw err;
  }
}

async function main() {
  console.log(`→ API: ${API}\n`);

  try {
    const res = await fetch(`${API}/stats`);
    if (!res.ok) throw new Error("unhealthy");
  } catch {
    throw new Error(
      `Nie mogę połączyć się z API pod ${API}. Uruchom najpierw: pnpm dev:api`,
    );
  }

  console.log("👤  Tworzę właściciela debaty (Marek Demo)...");
  const ownerAuth = await registerOrLogin(owner);

  console.log("💬  Tworzę debatę publiczną...");
  const debate = await jsonFetch("/debates", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: {
      thesis:
        "Praca zdalna powinna być domyślnym modelem zatrudnienia w branży IT.",
      visibility: "public",
      language: "pl",
    },
  });
  console.log(`    debata: ${debate.id}\n`);

  console.log(`👥  Rejestruję ${voters.length} głosujących...`);
  const voterAuths = [];
  for (let i = 0; i < voters.length; i++) {
    voterAuths.push(await registerOrLogin(voters[i]));
    process.stdout.write(`    ${i + 1}/${voters.length}\r`);
  }
  console.log("");

  console.log(`\n🌳  Buduję drzewo argumentów (${tree.length} wpisów)...`);
  const created = {};

  for (const node of tree) {
    const parentArgumentId = node.parent ? created[node.parent].id : null;
    const author = voterAuths[node.author];
    const arg = await jsonFetch(`/debates/${debate.id}/arguments`, {
      method: "POST",
      token: author.accessToken,
      body: {
        side: node.side,
        content: node.content,
        parentArgumentId,
      },
    });
    created[node.key] = arg;

    const depth = (() => {
      let d = 0;
      let cur = node.parent;
      while (cur) {
        d++;
        cur = tree.find((n) => n.key === cur)?.parent;
      }
      return d;
    })();

    process.stdout.write(
      `    [L${depth + 1}] ${node.key.padEnd(24)} ${node.side.toUpperCase().padEnd(8)}\n`,
    );
  }

  console.log(`\n🗳️   Oddaję głosy na drzewie...`);
  for (const node of tree) {
    const arg = created[node.key];
    const idxs = [...Array(voterAuths.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, node.votes);
    let cast = 0;
    for (const i of idxs) {
      const value = Math.random() > 0.25 ? 1 : -1;
      try {
        await jsonFetch(`/arguments/${arg.id}/votes`, {
          method: "POST",
          token: voterAuths[i].accessToken,
          body: { value },
        });
        cast++;
      } catch {
        // ignore - np. konflikt głosów przy ponownym seedzie
      }
    }
    process.stdout.write(`    ${node.key.padEnd(24)} → ${cast} głosów\n`);
  }

  const { Client } = pg;
  const dbUrl = process.env.DATABASE_URL;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (dbUrl && geminiKey) {
    console.log(`\n🧩  Uzupełniam wektory (embeddingi) dla argumentów...`);
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await new Promise((r) => setTimeout(r, 2000));

    const queryRes = await client.query(
      `SELECT id, content FROM arguments WHERE debate_id = $1 AND embedding IS NULL`,
      [debate.id],
    );

    if (queryRes.rows.length > 0) {
      let successCount = 0;
      for (const row of queryRes.rows) {
        try {
          const response = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: row.content,
          });
          const embedding = response.embeddings?.[0]?.values;
          if (embedding && embedding.length > 0) {
            await client.query(
              `UPDATE arguments SET embedding = $1::jsonb WHERE id = $2`,
              [JSON.stringify(embedding), row.id],
            );
            successCount++;
          }
        } catch {
          // ignore
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      console.log(
        `    Wektory zostały uzupełnione (${successCount}/${queryRes.rows.length}).`,
      );
    } else {
      console.log(`    Wszystkie wektory wygenerowane przez API w tle.`);
    }
    await client.end();
  } else {
    console.log(
      `\n⚠️   Brak DATABASE_URL lub GEMINI_API_KEY w .env. Pomięto ręczne generowanie wektorów.`,
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅  DEMO GOTOWE - debata PL o pracy zdalnej (4 poziomy)");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Otwórz w przeglądarce:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
}

main().catch((err) => {
  console.error("\n❌  Seed nie powiódł się:", err.message);
  process.exit(1);
});
