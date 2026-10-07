// Seeds a public, Polish-language debate with a 4-level argument tree.
// Topic: czy energia jądrowa jest niezbędna do osiągnięcia neutralności
// klimatycznej Polski.
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
//   pnpm seed:nuclear:pl

import pg from "pg";
import { GoogleGenAI } from "@google/genai";
import { createApiClient } from "./lib/api-client.mjs";
import { loadEnv } from "./lib/env.mjs";

loadEnv();
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

// 4-poziomowe drzewo, 22 węzły. Jak w seed-remote-work-pl.mjs, każda gałąź
// to spójny ciąg zarzut -> obrona -> kontra, nie luźne stwierdzenia wobec tezy.
const tree = [
  // ─── L1 (bezpośrednio pod tezą) ──────────────────────────────────────────
  {
    key: "MAIN",
    parent: null,
    side: "pro",
    author: 0,
    votes: 8,
    content:
      "Energia jądrowa dostarcza stabilną moc bazową niezależną od pogody, czego elektrownie wiatrowe i słoneczne nie są w stanie samodzielnie zagwarantować.",
  },
  {
    key: "L1.B",
    parent: null,
    side: "pro",
    author: 1,
    votes: 6,
    content:
      "Elektrownia jądrowa zajmuje ułamek powierzchni potrzebnej farmie fotowoltaicznej o porównywalnej rocznej produkcji energii.",
  },
  {
    key: "L1.C",
    parent: null,
    side: "against",
    author: 2,
    votes: 6,
    content:
      "Budowa elektrowni jądrowej w Polsce trwa kilkanaście lat, więc nie pomoże osiągnąć celów klimatycznych na najbliższą dekadę.",
  },
  {
    key: "L1.D",
    parent: null,
    side: "against",
    author: 3,
    votes: 5,
    content:
      "Problem składowania odpadów wysokoaktywnych pozostaje nierozwiązany w horyzoncie dziesiątek tysięcy lat.",
  },
  {
    key: "L1.E",
    parent: null,
    side: "pro",
    author: 4,
    votes: 5,
    content:
      "Reaktor jądrowy nie emituje dwutlenku węgla podczas pracy, co czyni go realną alternatywą dla elektrowni węglowych.",
  },
  {
    key: "L1.F",
    parent: null,
    side: "against",
    author: 5,
    votes: 4,
    content:
      "Koszt budowy i finansowania elektrowni jądrowej systematycznie przekracza pierwotne kosztorysy w większości realizowanych projektów.",
  },
  {
    key: "L1.G",
    parent: null,
    side: "against",
    author: 6,
    votes: 4,
    content:
      "Uzależnienie od pojedynczego dostawcy technologii i paliwa jądrowego rodzi ryzyko geopolityczne porównywalne z dzisiejszym uzależnieniem od importu gazu.",
  },
  {
    key: "L1.H",
    parent: null,
    side: "pro",
    author: 7,
    votes: 4,
    content:
      "Kraje takie jak Francja pokazują, że elektrownie jądrowe mogą dostarczać większość krajowej energii elektrycznej przy jednych z najniższych emisji CO2 w Europie.",
  },

  // ─── L2 (odpowiedzi na L1) ───────────────────────────────────────────────
  {
    key: "L2.MAIN.contra",
    parent: "MAIN",
    side: "against",
    author: 0,
    votes: 4,
    content:
      "Stabilność mocy bazowej można też uzyskać magazynami energii i elastycznym zarządzaniem popytem, bez ryzyk właściwych energetyce jądrowej.",
  },
  {
    key: "L2.MAIN.support",
    parent: "MAIN",
    side: "pro",
    author: 1,
    votes: 4,
    content:
      "Elektrownia jądrowa osiąga współczynnik wykorzystania mocy przekraczający 90%, podczas gdy farmy wiatrowe i fotowoltaiczne w Polsce wykorzystują nominalną moc jedynie okresowo, co bezpośrednio potwierdza przewagę stabilności dostaw.",
  },
  {
    key: "L2.B.contra",
    parent: "L1.B",
    side: "against",
    author: 2,
    votes: 3,
    content:
      "Mała powierzchnia zajęta przez sam reaktor nie uwzględnia stref bezpieczeństwa i infrastruktury towarzyszącej, znacząco większej niż sama elektrownia.",
  },
  {
    key: "L2.C.support",
    parent: "L1.C",
    side: "against",
    author: 3,
    votes: 3,
    content:
      "Opóźnienie inwestycji nie unieważnia jej sensu - część miksu energetycznego musi już dziś zakładać horyzont po 2035 roku.",
  },
  {
    key: "L2.D.support",
    parent: "L1.D",
    side: "against",
    author: 4,
    votes: 3,
    content:
      "Ilość odpadów wysokoaktywnych z całego cyklu życia reaktora jest, w przeliczeniu na wyprodukowaną energię, radykalnie mniejsza niż odpadów górniczych z wydobycia węgla.",
  },
  {
    key: "L2.F.support",
    parent: "L1.F",
    side: "against",
    author: 5,
    votes: 3,
    content:
      "Przekroczenia kosztorysów dotyczą głównie pierwszych bloków danej technologii - kolejne bloki tego samego typu bywają budowane taniej i szybciej.",
  },
  {
    key: "L2.G.support",
    parent: "L1.G",
    side: "against",
    author: 6,
    votes: 3,
    content:
      "Dywersyfikacja dostawców paliwa jądrowego oraz zapasy strategiczne na lata pracy reaktora skutecznie ograniczają to ryzyko, czego nie da się powiedzieć o bieżących dostawach gazu.",
  },
  {
    key: "L2.H.contra",
    parent: "L1.H",
    side: "against",
    author: 7,
    votes: 3,
    content:
      "Sukces francuskiego modelu opierał się na scentralizowanym, państwowym programie budowy z lat 70. i 80. - warunków politycznych i finansowych, które trudno dziś odtworzyć.",
  },

  // ─── L3 (odpowiedzi na L2) ───────────────────────────────────────────────
  {
    key: "L3.MAIN.contra.rebut",
    parent: "L2.MAIN.contra",
    side: "against",
    author: 0,
    votes: 2,
    content:
      "Magazyny wystarczające na pokrycie wielodniowego deficytu wiatru i słońca wymagają skali, która dziś nie istnieje w żadnym kraju europejskim.",
  },
  {
    key: "L3.MAIN.support.rebut",
    parent: "L2.MAIN.support",
    side: "against",
    author: 1,
    votes: 2,
    content:
      "Wysoki współczynnik wykorzystania mocy nie oznacza elastyczności - reaktora nie da się szybko wyłączyć ani włączyć w reakcji na chwilowy nadmiar energii z OZE, co w praktyce utrudnia bilansowanie sieci.",
  },
  {
    key: "L3.C.support.rebut",
    parent: "L2.C.support",
    side: "against",
    author: 2,
    votes: 2,
    content:
      "Zakładanie miksu po 2035 roku nie zwalnia z pytania, czym pokryjemy lukę mocy w najbliższej dekadzie, gdy stare bloki węglowe będą wygaszane.",
  },
  {
    key: "L3.F.support.rebut",
    parent: "L2.F.support",
    side: "against",
    author: 3,
    votes: 2,
    content:
      "Efekt uczenia się w kolejnych blokach nie wystąpił w większości europejskich projektów ostatniej dekady, gdzie każdy kolejny blok wciąż przekraczał budżet.",
  },

  // ─── L4 (odpowiedzi na L3) ───────────────────────────────────────────────
  {
    key: "L4.MAIN.deepest",
    parent: "L3.MAIN.support.rebut",
    side: "against",
    author: 4,
    votes: 2,
    content:
      "Brak elastyczności nie jest przeszkodą, gdy elektrownia jądrowa pokrywa jedynie stabilne zapotrzebowanie bazowe, a szczytowe wahania bilansuje się elastycznymi źródłami uzupełniającymi, na przykład gazowymi.",
  },
  {
    key: "L4.C.deepest",
    parent: "L3.C.support.rebut",
    side: "against",
    author: 5,
    votes: 2,
    content:
      "Lukę do 2035 roku można pokryć elastycznymi blokami gazowymi jako rozwiązaniem przejściowym, bez rezygnacji z docelowego miksu z udziałem atomu.",
  },
];

const { jsonFetch, registerOrLogin } = createApiClient({
  baseUrl: API,
  password: PASSWORD,
});

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
        "Energia jądrowa jest niezbędna do osiągnięcia neutralności klimatycznej Polski.",
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
  console.log("✅  DEMO GOTOWE - debata PL o energii jądrowej (4 poziomy)");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Otwórz w przeglądarce:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
}

main().catch((err) => {
  console.error("\n❌  Seed nie powiódł się:", err.message);
  process.exit(1);
});
