// Seeduje "żywą" debatę pod prezentację seminaryjną na uczelni.
// Temat: dopuszczalność generatywnej AI przy pisaniu prac dyplomowych -
// dyskusja, którą sama publiczność seminarium prowadzi na co dzień.
//
// Struktura: 4-poziomowe drzewo argumentów (replies-to-replies-to-replies),
// 15 polskich kont głosujących, główny argument o wadze 15 jako cel duplikatu.
//
// Wymagania:
//   - API uruchomione (pnpm dev:api)
//   - Node 18+
//
// Uruchomienie:
//   pnpm seed:seminar

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

// Prywatna grupa, w której toczy się debata. Owner zaprasza wszystkich
// uczestników, a każdy zaproszony akceptuje zaproszenie ze swojego panelu.
const GROUP_NAME = "Seminarium Magisterskie 2026";

const presenter = {
  displayName: "Nowy Uczestnik",
  email: "demo-presenter@brainstorm.test",
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
  {
    displayName: "Agnieszka Szymańska",
    email: "agnieszka.szymanska@brainstorm.test",
  },
  { displayName: "Marek Woźniak", email: "marek.wozniak@brainstorm.test" },
  {
    displayName: "Joanna Dąbrowska",
    email: "joanna.dabrowska@brainstorm.test",
  },
  { displayName: "Paweł Kozłowski", email: "pawel.kozlowski@brainstorm.test" },
  {
    displayName: "Małgorzata Jankowska",
    email: "malgorzata.jankowska@brainstorm.test",
  },
  { displayName: "Łukasz Mazur", email: "lukasz.mazur@brainstorm.test" },
  {
    displayName: "Barbara Krawczyk",
    email: "barbara.krawczyk@brainstorm.test",
  },
];

// 4-poziomowe drzewo argumentów. Każdy węzeł:
//   key      - alias do referencji jako rodzic potomków
//   parent   - alias rodzica (null = bezpośrednio pod tezą)
//   side     - strona względem tezy ('pro' | 'against')
//   author   - indeks w voters[] (kto napisał)
//   votes    - liczba głosów Za do oddania (Przeciw głosy też się losowo dodają niżej)
//   content  - treść argumentu
//
// MAIN to nasz cel duplikatu - zawsze otrzymuje 15 głosów Za.
const tree = [
  // ─── L1 (direct children of thesis) ─────────────────────────────────────
  {
    key: "MAIN",
    parent: null,
    side: "pro",
    author: 0,
    votes: 15,
    content:
      "Generatywna AI to po prostu kolejne narzędzie pracy - jak edytor tekstu czy wyszukiwarka - które przyspiesza zbieranie materiałów i pozwala studentowi skupić się na krytycznym myśleniu zamiast na żmudnym formatowaniu.",
  },
  {
    key: "L1.B",
    parent: null,
    side: "pro",
    author: 1,
    votes: 8,
    content:
      "AI wyrównuje szanse studentów nieanglojęzycznych oraz osób z dysleksją, czyniąc proces pisania pracy bardziej dostępnym.",
  },
  {
    key: "L1.C",
    parent: null,
    side: "against",
    author: 2,
    votes: 7,
    content:
      "Korzystanie z AI podważa rzetelność oceny - promotor nie wie już, czyje kompetencje ocenia: studenta czy modelu językowego.",
  },
  {
    key: "L1.D",
    parent: null,
    side: "against",
    author: 3,
    votes: 6,
    content:
      "Modele generują przekonująco brzmiące, ale nieistniejące źródła (halucynacje), co zatruwa warsztat naukowy młodych badaczy.",
  },

  // ─── L2 (children of L1) ────────────────────────────────────────────────
  {
    key: "L2.MAIN.contra",
    parent: "MAIN",
    side: "against",
    author: 4,
    votes: 5,
    content:
      "Porównanie do kalkulatora jest mylne - kalkulator wykonuje zdefiniowaną operację, a AI tworzy treść merytoryczną, czyli dokładnie to, co praca dyplomowa ma weryfikować.",
  },
  {
    key: "L2.MAIN.support",
    parent: "MAIN",
    side: "pro",
    author: 5,
    votes: 4,
    content:
      "Tak jak nikt dziś nie pisze pracy bez wyszukiwarki i menedżera cytowań, AI to kolejna naturalna warstwa narzędzi badacza - zakaz cofa nas do epoki maszyny do pisania.",
  },
  {
    key: "L2.B.contra",
    parent: "L1.B",
    side: "against",
    author: 6,
    votes: 5,
    content:
      "Dostępność jest pozorna - najlepsze modele są płatne, więc AI pogłębia przepaść między zamożnymi a uboższymi studentami.",
  },
  {
    key: "L2.C.contra",
    parent: "L1.C",
    side: "against",
    author: 7,
    votes: 4,
    content:
      "Problem oceny rozwiązuje obrona ustna - jeśli student potrafi obronić każdą tezę swojej pracy, sposób jej powstania jest drugorzędny.",
  },
  {
    key: "L2.D.contra",
    parent: "L1.D",
    side: "against",
    author: 8,
    votes: 3,
    content:
      "Halucynacje to kwestia braku weryfikacji - nauczenie studentów sprawdzania źródeł podanych przez AI jest cenną kompetencją samą w sobie.",
  },

  // ─── L3 (children of L2) ────────────────────────────────────────────────
  {
    key: "L3.MAIN.contra.rebut",
    parent: "L2.MAIN.contra",
    side: "against",
    author: 9,
    votes: 4,
    content:
      "Nawet jeśli AI tworzy treść, finalna odpowiedzialność i obrona spoczywają na studencie - narzędzie nie zdaje za niego egzaminu dyplomowego.",
  },
  {
    key: "L3.MAIN.support.rebut",
    parent: "L2.MAIN.support",
    side: "against",
    author: 10,
    votes: 3,
    content:
      "Wyszukiwarka pokazuje cudze źródła do samodzielnej oceny, a AI podaje gotową syntezę jako własną - to jakościowo inna ingerencja w proces twórczy.",
  },
  {
    key: "L3.B.contra.support",
    parent: "L2.B.contra",
    side: "pro",
    author: 11,
    votes: 4,
    content:
      "Uczelnie mogą wykupić licencje grupowe na narzędzia AI, tak jak dziś finansują dostęp do baz Scopus, JSTOR czy Web of Science.",
  },
  {
    key: "L3.C.contra.rebut",
    parent: "L2.C.contra",
    side: "against",
    author: 12,
    votes: 3,
    content:
      "Obrona ustna sprawdza zrozumienie tematu, ale nie umiejętność samodzielnego prowadzenia pisemnego wywodu - kluczowej kompetencji absolwenta.",
  },

  // ─── L4 (children of L3) ────────────────────────────────────────────────
  {
    key: "L4.MAIN.deepest",
    parent: "L3.MAIN.contra.rebut",
    side: "against",
    author: 13,
    votes: 2,
    content:
      "Skoro odpowiedzialność i tak jest po stronie studenta, to przy masowym użyciu AI sam dyplom przestaje cokolwiek poświadczać o jego realnych umiejętnościach pisarskich.",
  },
  {
    key: "L4.B.deepest",
    parent: "L3.B.contra.support",
    side: "against",
    author: 14,
    votes: 3,
    content:
      "Licencje grupowe nie zlikwidują luki kompetencyjnej - student płacący za prywatny, mocniejszy model i tak ćwiczy z nim więcej niż ten korzystający tylko z dostępu uczelnianego.",
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

// Auth zwraca tylko accessToken - id użytkownika bierzemy z /users/me.
async function getMyId(token) {
  const me = await jsonFetch("/users/me", { token });
  return me.id;
}

// Zaproś użytkownika do grupy i od razu zaakceptuj zaproszenie jego tokenem.
// Idempotentne: ignoruje konflikt, gdy uczestnik jest już członkiem/zaproszony.
async function inviteAndAccept(groupId, ownerToken, inviteeToken, inviteeId) {
  let invitation;
  try {
    invitation = await jsonFetch(`/groups/${groupId}/invitations`, {
      method: "POST",
      token: ownerToken,
      body: { inviteeId },
    });
  } catch (err) {
    // 409 = już zaproszony lub już członek - przy ponownym seedzie OK.
    if (err.status === 409) return;
    throw err;
  }
  try {
    await jsonFetch(`/invitations/${invitation.id}/accept`, {
      method: "POST",
      token: inviteeToken,
    });
  } catch (err) {
    if (err.status === 409) return; // już zaakceptowane
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

  console.log("👤  Tworzę właściciela grupy i debaty (Marek Demo)...");
  const ownerAuth = await registerOrLogin(owner);

  console.log(`👪  Tworzę prywatną grupę "${GROUP_NAME}"...`);
  const group = await jsonFetch("/groups", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: { name: GROUP_NAME },
  });
  console.log(`    grupa: ${group.id}\n`);

  console.log("👥  Rejestruję 15 głosujących (polskie imiona)...");
  const voterAuths = [];
  const voterIds = [];
  for (let i = 0; i < voters.length; i++) {
    const auth = await registerOrLogin(voters[i]);
    voterAuths.push(auth);
    voterIds.push(await getMyId(auth.accessToken));
    process.stdout.write(`    ${i + 1}/${voters.length}\r`);
  }
  console.log("");

  console.log(
    "👤  Rejestruję prezentera (czyste konto - NIE głosuje w seedzie)...",
  );
  const presenterAuth = await registerOrLogin(presenter);
  const presenterId = await getMyId(presenterAuth.accessToken);

  console.log(
    `\n✉️   Zapraszam uczestników do grupy i akceptuję zaproszenia...`,
  );
  for (let i = 0; i < voters.length; i++) {
    await inviteAndAccept(
      group.id,
      ownerAuth.accessToken,
      voterAuths[i].accessToken,
      voterIds[i],
    );
    process.stdout.write(`    ${i + 1}/${voters.length}\r`);
  }
  console.log("");
  await inviteAndAccept(
    group.id,
    ownerAuth.accessToken,
    presenterAuth.accessToken,
    presenterId,
  );
  console.log("    prezenter dołączony do grupy ✓");

  console.log("\n💬  Tworzę debatę w grupie (prywatną)...");
  const debate = await jsonFetch("/debates", {
    method: "POST",
    token: ownerAuth.accessToken,
    body: {
      thesis:
        "Studenci powinni mieć prawo używać generatywnej AI przy pisaniu prac dyplomowych.",
      visibility: "private",
      groupId: group.id,
    },
  });
  console.log(`    debata: ${debate.id}\n`);

  console.log(
    `\n🌳  Buduję 4-poziomowe drzewo argumentów (${tree.length} wpisów)...`,
  );
  const created = {}; // key → ArgumentDto
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
      `    [L${depth + 1}] ${node.key.padEnd(28)} ${node.side.toUpperCase().padEnd(8)}\n`,
    );
  }

  console.log(`\n🗳️   Oddaję głosy na drzewie...`);
  for (const node of tree) {
    const arg = created[node.key];
    // Tasuj voterów dla każdego argumentu, weź pierwszych N
    const idxs = [...Array(voterAuths.length).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, node.votes);
    let cast = 0;
    for (const i of idxs) {
      // Mix in Przeciw głosy dla głębszych warstw - daje organiczny look,
      // ale MAIN dostaje wyłącznie Za, żeby waga wyszła dokładnie 15.
      const value = node.key === "MAIN" ? 1 : Math.random() > 0.25 ? 1 : -1;
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
    process.stdout.write(`    ${node.key.padEnd(28)} → ${cast} głosów\n`);
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
      `\n🧩  Uzupełniam wektory (embeddingi) dla argumentów, aby wykrywanie duplikatów działało od razu...`,
    );
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Dajemy API 2 sekundy na przetworzenie własnych asynchronicznych zadań
    await new Promise((r) => setTimeout(r, 2000));

    const queryRes = await client.query(
      `SELECT id, content FROM arguments WHERE debate_id = $1 AND embedding IS NULL`,
      [debate.id],
    );

    if (queryRes.rows.length > 0) {
      console.log(
        `    Znaleziono ${queryRes.rows.length} argumentów wymagających ręcznego wygenerowania wektora.`,
      );
      let successCount = 0;
      for (let i = 0; i < queryRes.rows.length; i++) {
        const row = queryRes.rows[i];
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
        } catch (err) {
          // ignore
        }
        await new Promise((resolve) => setTimeout(resolve, 200)); // anti rate-limit
      }
      console.log(
        `    Wektory zostały uzupełnione (${successCount}/${queryRes.rows.length}).`,
      );
    } else {
      console.log(
        `    Wszystkie wektory zostały wygenerowane pomyślnie przez API w tle.`,
      );
    }
    await client.end();
  } else {
    console.log(
      `\n⚠️   Brak DATABASE_URL lub GEMINI_API_KEY w .env. Pomięto ręczne generowanie wektorów.`,
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("✅  DEMO GOTOWE - 4-poziomowe drzewo + waga 15");
  console.log("═══════════════════════════════════════════════════════════\n");
  console.log(`👪  Debata w prywatnej grupie: "${GROUP_NAME}"`);
  console.log(`    grupa: ${group.id}\n`);
  console.log(`📍  Otwórz w przeglądarce:`);
  console.log(`    ${WEB}/dyskusje/${debate.id}\n`);
  console.log(
    `    waga głównego argumentu:  ${finalMain?.weight ?? "?"}  (oczekiwane: 15)`,
  );
  console.log(
    `    suma argumentów w grafie: ${allArgs.length}  (oczekiwane: ${tree.length})\n`,
  );
  console.log(`🔑  Zaloguj się jako prezenter:`);
  console.log(`    email:  ${presenter.email}`);
  console.log(`    hasło:  ${PASSWORD}\n`);
  console.log(`📝  Tekst duplikatu do wklejenia w "Dodaj argument Za":`);
  console.log(
    `    "AI jest jak zaawansowane narzędzie badawcze - skraca czas`,
  );
  console.log(
    `     potrzebny na zbieranie materiałów i pozwala studentowi skupić`,
  );
  console.log(`     się na analizie zamiast na technicznych detalach pisania."\n`);
  console.log(`⚠️   Detekcja duplikatu wymaga GEMINI_API_KEY w .env API.`);
  console.log(
    `    Bez klucza embeddingi nie powstaną i modal NIE pojawi się.\n`,
  );
}

main().catch((err) => {
  console.error("\n❌  Seed nie powiódł się:", err.message);
  process.exit(1);
});
