// Seeduje małą, publiczną debatę o samochodach elektrycznych.
// Lżejszy wariant seedu - 7 argumentów, 2 poziomy, bez grupy prywatnej.
//
// Wymagania:
//   - API uruchomione (pnpm dev:api)
//   - Node 18+
//
// Uruchomienie:
//   pnpm seed:ev

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

// Małe drzewo: 4 argumenty bezpośrednio pod tezą + 3 odpowiedzi (L2).
// MAIN dostaje komplet 8 głosów Za (= liczba głosujących), reszta mniej.
const tree = [
  // ─── L1 (direct children of thesis) ──────────────────────────────────────
  {
    key: "MAIN",
    parent: null,
    side: "pro",
    author: 0,
    votes: 8,
    content:
      "Koszt eksploatacji auta elektrycznego jest znacznie niższy - energia elektryczna jest tańsza od paliwa, a silnik elektryczny ma mniej części wymagających serwisu.",
  },
  {
    key: "L1.B",
    parent: null,
    side: "pro",
    author: 1,
    votes: 7,
    content:
      "Pojazdy elektryczne nie emitują spalin w miejscu jazdy, co realnie poprawia jakość powietrza w zatłoczonych miastach.",
  },
  {
    key: "L1.C",
    parent: null,
    side: "against",
    author: 2,
    votes: 6,
    content:
      "Produkcja baterii oraz wydobycie litu i kobaltu mają duży ślad środowiskowy, który podważa hasło o pełnej ekologiczności.",
  },
  {
    key: "L1.D",
    parent: null,
    side: "against",
    author: 3,
    votes: 5,
    content:
      "Wysoka cena zakupu i wciąż niedostateczna sieć ładowarek skutecznie zniechęcają przeciętnego kierowcę.",
  },

  // ─── L2 (replies) ─────────────────────────────────────────────────────────
  {
    key: "L2.MAIN.contra",
    parent: "MAIN",
    side: "against",
    author: 4,
    votes: 4,
    content:
      "Oszczędność na paliwie topnieje, gdy ładujesz poza domem - komercyjne szybkie ładowarki potrafią być droższe w przeliczeniu na kilometr niż benzyna.",
  },
  {
    key: "L2.C.rebut",
    parent: "L1.C",
    side: "pro",
    author: 5,
    votes: 4,
    content:
      "Ślad produkcji baterii amortyzuje się po kilku latach jazdy, a zużyte ogniwa trafiają do recyklingu i magazynów energii (second-life), zamykając obieg surowców.",
  },
  {
    key: "L2.D.rebut",
    parent: "L1.D",
    side: "pro",
    author: 6,
    votes: 5,
    content:
      "Dopłaty rządowe obniżają cenę zakupu, a sieć szybkich ładowarek przy trasach rośnie z roku na rok w tempie kilkudziesięciu procent.",
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

  console.log("👤  Tworzę autora debaty (Marek Demo)...");
  const ownerAuth = await registerOrLogin(owner);

  console.log("💬  Tworzę publiczną debatę...");
  const debate = await jsonFetch("/debates", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: {
      thesis:
        "Samochody elektryczne stanowią ekologiczną i ekonomiczną alternatywę dla pojazdów spalinowych.",
      visibility: "public",
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
  let mainArgId = null;

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
    if (node.key === "MAIN") mainArgId = arg.id;

    const depth = node.parent ? 2 : 1;
    process.stdout.write(
      `    [L${depth}] ${node.key.padEnd(20)} ${node.side.toUpperCase().padEnd(8)}\n`,
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
      // MAIN dostaje wyłącznie Za; reszta - losowy mix dla organicznego looku.
      const value = node.key === "MAIN" ? 1 : Math.random() > 0.3 ? 1 : -1;
      try {
        await jsonFetch(`/arguments/${arg.id}/votes`, {
          method: "POST",
          token: voterAuths[i].accessToken,
          body: { value },
        });
        cast++;
      } catch {
        /* ignore - np. konflikt głosów przy ponownym seedzie */
      }
    }
    process.stdout.write(`    ${node.key.padEnd(20)} → ${cast} głosów\n`);
  }

  console.log("\n🔍  Weryfikuję końcową wagę głównego argumentu...");
  const allArgs = await jsonFetch(`/debates/${debate.id}/arguments`, {
    token: ownerAuth.accessToken,
  });
  const finalMain = allArgs.find((a) => a.id === mainArgId);

  const { Client } = pg;
  const dbUrl = process.env.DATABASE_URL;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (dbUrl && geminiKey) {
    console.log(
      `\n🧩  Uzupełniam wektory (embeddingi) dla argumentów...`,
    );
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
        `    Wektory uzupełnione (${successCount}/${queryRes.rows.length}).`,
      );
    } else {
      console.log(`    Wszystkie wektory wygenerowane przez API w tle.`);
    }
    await client.end();
  } else {
    console.log(
      `\n⚠️   Brak DATABASE_URL lub GEMINI_API_KEY w .env. Pomięto generowanie wektorów.`,
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅  DEMO GOTOWE - mała publiczna debata o autach elektrycznych");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`📍  Otwórz w przeglądarce:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
  console.log(
    `    waga głównego argumentu:  ${finalMain?.weight ?? "?"}  (oczekiwane: 8)`,
  );
  console.log(
    `    suma argumentów w grafie: ${allArgs.length}  (oczekiwane: ${tree.length})\n`,
  );
}

main().catch((err) => {
  console.error("\n❌  Seed nie powiódł się:", err.message);
  process.exit(1);
});
