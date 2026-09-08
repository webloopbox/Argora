// Requirement verification harness for praca_pisemna.md, §7.7 (Table 7.7).
//
// Drives the real HTTP endpoints of a running instance and reports, per
// functional requirement WF1..WF12, whether the observable behaviour matches
// the specification in §4.4. Requirements whose substance lives in the visual
// layer (colour coding, sentiment badge, lasso gesture) cannot be settled
// here; those rows are reported as "poza zakresem skryptu" so that the thesis
// does not claim more than was measured.
//
// The script writes into the database it talks to, so point it at the test
// database (brainstorm_test), never at the one holding the seeded demo
// debates. Start the API with:
//
//   set -a && . ./.env && set +a \
//     && DATABASE_URL=<...brainstorm_test> NODE_ENV=test pnpm --filter ./apps/api dev
//
// AI keys must be present, because WF6..WF10 call the provider for real.
//
// Execution:
//   node scripts/verify-requirements.mjs

import * as fs from "fs";
import * as path from "path";

const API = process.env.API_URL ?? "http://localhost:3000";
const PASSWORD = "haslo1234";
const STAMP = Date.now();
const OUT_PATH = "scripts/verify-requirements-raw.json";

const results = [];

function record(wf, name, ok, detail) {
  results.push({ wf, name, ok, detail });
  const mark = ok === true ? "OK  " : ok === false ? "BLAD" : "----";
  console.log(`${mark} ${wf.padEnd(5)} ${name}\n       ${detail}`);
}

async function api(pathname, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, ok: res.ok, json };
}

async function must(label, promise) {
  const res = await promise;
  if (!res.ok) {
    throw new Error(`${label}: HTTP ${res.status} ${JSON.stringify(res.json)}`);
  }
  return res.json;
}

async function register(prefix, displayName) {
  const email = `wf-${prefix}-${STAMP}@brainstorm.test`;
  const auth = await must(
    `rejestracja ${prefix}`,
    api("/auth/register", {
      method: "POST",
      body: { email, password: PASSWORD, displayName },
    }),
  );
  const me = await must(
    `profil ${prefix}`,
    api("/users/me", { token: auth.accessToken }),
  );
  return { email, token: auth.accessToken, id: me.id };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Embeddings are computed after the response is returned, so duplicate
// detection only becomes available once the vector lands in the row. A
// similarity above zero proves at least one candidate already carries one.
async function waitForEmbeddings(debateId, token, content, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    const check = await api("/ai/arguments/check-duplicate", {
      method: "POST",
      token,
      body: { debateId, side: "pro", content },
    });
    if (check.ok) {
      last = check.json;
      if (last.similarity > 0) return last;
    }
    await sleep(3000);
  }
  return last;
}

async function main() {
  const health = await api("/stats");
  if (!health.ok) {
    throw new Error(`API nie odpowiada pod ${API}. Uruchom warstwę serwerową.`);
  }
  console.log(`\nWeryfikacja wymagań funkcjonalnych, API: ${API}\n`);

  const alice = await register("alice", "Alicja Weryfikacja");
  const bob = await register("bob", "Bartosz Weryfikacja");
  const carol = await register("carol", "Cezary Weryfikacja");

  // --- WF1: utworzenie debaty z tezą, widocznością i językiem ---
  const thesis =
    "Zdalne nauczanie akademickie powinno pozostać stałym elementem oferty uczelni.";
  const debate = await must(
    "utworzenie debaty",
    api("/debates", {
      method: "POST",
      token: alice.token,
      body: { thesis, visibility: "public", language: "pl" },
    }),
  );
  const fetched = await must("odczyt debaty", api(`/debates/${debate.id}`));
  const english = await must(
    "debata angielska",
    api("/debates", {
      method: "POST",
      token: alice.token,
      body: {
        thesis: "University teaching should stay partly remote.",
        visibility: "public",
        language: "en",
      },
    }),
  );
  record(
    "WF1",
    "Utworzenie debaty z tezą, trybem widoczności i językiem",
    fetched.thesis === thesis &&
      fetched.visibility === "public" &&
      fetched.language === "pl" &&
      english.language === "en",
    `teza zgodna, widoczność ${fetched.visibility}, język ${fetched.language} oraz ${english.language} dla drugiej debaty; brak punktu końcowego zmieniającego język`,
  );

  // --- WF2: dodanie argumentu ze wskazaniem strony i węzła nadrzędnego ---
  const root = await must(
    "argument pod tezą",
    api(`/debates/${debate.id}/arguments`, {
      method: "POST",
      token: alice.token,
      body: {
        side: "pro",
        content:
          "Zajęcia zdalne pozwalają studentom spoza dużych ośrodków uczestniczyć w wykładach bez przeprowadzki.",
      },
    }),
  );
  const child = await must(
    "argument potomny",
    api(`/debates/${debate.id}/arguments`, {
      method: "POST",
      token: bob.token,
      body: {
        side: "against",
        content:
          "Dojazd na uczelnię jest jednorazowym kosztem, a stypendium socjalne pokrywa go w całości.",
        parentArgumentId: root.id,
      },
    }),
  );
  const grandchild = await must(
    "argument trzeciego poziomu",
    api(`/debates/${debate.id}/arguments`, {
      method: "POST",
      token: alice.token,
      body: {
        side: "against",
        content:
          "Stypendium socjalne przysługuje wąskiej grupie i nie pokrywa najmu w mieście akademickim.",
        parentArgumentId: child.id,
      },
    }),
  );
  const badSide = await api(`/debates/${debate.id}/arguments`, {
    method: "POST",
    token: alice.token,
    body: { side: "obok", content: "Treść z nieprawidłową stroną sporu." },
  });
  record(
    "WF2",
    "Dodanie argumentu ze wskazaniem węzła nadrzędnego i strony sporu",
    root.parentArgumentId === null &&
      child.parentArgumentId === root.id &&
      grandchild.parentArgumentId === child.id &&
      badSide.status === 400,
    `drzewo trzech poziomów zbudowane poprawnie, strona spoza słownika odrzucona kodem ${badSide.status}`,
  );

  // --- WF3: dane grafu (warstwa danych; kodowanie kolorem poza zakresem) ---
  const list = await must(
    "lista argumentów",
    api(`/debates/${debate.id}/arguments`),
  );
  const hasEdges = list.every(
    (a) => a.parentArgumentId === null || list.some((p) => p.id === a.parentArgumentId),
  );
  record(
    "WF3",
    "Prezentacja debaty jako grafu z kodowaniem kolorem",
    hasEdges && list.every((a) => a.side === "pro" || a.side === "against")
      ? null
      : false,
    `zasób zwraca ${list.length} węzłów z kompletnymi krawędziami i stroną sporu przy każdym; samo odwzorowanie na kolor rozstrzyga warstwa kliencka`,
  );

  // --- WF4: głosy i waga jako suma bezwzględna ---
  await must(
    "głos popierający",
    api(`/arguments/${root.id}/votes`, {
      method: "POST",
      token: alice.token,
      body: { value: 1 },
    }),
  );
  const afterTwo = await must(
    "głos przeciwny",
    api(`/arguments/${root.id}/votes`, {
      method: "POST",
      token: bob.token,
      body: { value: -1 },
    }),
  );
  const afterThird = await must(
    "trzeci głos",
    api(`/arguments/${root.id}/votes`, {
      method: "POST",
      token: carol.token,
      body: { value: 1 },
    }),
  );
  const afterRetract = await must(
    "wycofanie głosu",
    api(`/arguments/${root.id}/votes`, {
      method: "DELETE",
      token: carol.token,
    }),
  );
  record(
    "WF4",
    "Głosowanie oraz waga jako suma obu rodzajów głosów",
    afterTwo.weight === 2 &&
      afterTwo.forCount === 1 &&
      afterTwo.againstCount === 1 &&
      afterThird.weight === 3 &&
      afterRetract.weight === 2,
    `waga 1+1 = ${afterTwo.weight} mimo wyniku netto zero, po trzecim głosie ${afterThird.weight}, po wycofaniu ${afterRetract.weight}`,
  );

  // --- WF5: wskaźnik sentymentu wraz ze stanem wysokiej kontrowersji ---
  const balanced = afterTwo.sentiment;
  const dominant = afterThird.sentiment;
  const singleVote = (
    await must(
      "pojedynczy głos",
      api(`/arguments/${grandchild.id}/votes`, {
        method: "POST",
        token: bob.token,
        body: { value: 1 },
      }),
    )
  ).sentiment;
  record(
    "WF5",
    "Wskaźnik sentymentu z wyróżnieniem wysokiej kontrowersji",
    balanced === "controversy" && dominant === "pro" && singleVote === "pro",
    `głosy 1:1 dają stan ${balanced}, przewaga 2:1 stan ${dominant}, pojedynczy głos popierający stan ${singleVote}; prezentacja odznaki należy do warstwy klienckiej`,
  );

  // --- WF6: obowiązkowe porównanie semantyczne przed zapisem ---
  const paraphrase =
    "Osoby mieszkające daleko od uczelni mogą dzięki zajęciom online studiować bez zmiany miejsca zamieszkania.";
  const duplicate = await waitForEmbeddings(debate.id, carol.token, paraphrase);
  const distinct = duplicate
    ? await must(
        "sprawdzenie treści odrębnej",
        api("/ai/arguments/check-duplicate", {
          method: "POST",
          token: carol.token,
          body: {
            debateId: debate.id,
            side: "pro",
            content:
              "Nagrania wykładów pozwalają wrócić do trudnego fragmentu przed egzaminem.",
          },
        }),
      )
    : null;
  record(
    "WF6",
    "Porównanie semantyczne nowego argumentu przed zapisem",
    Boolean(duplicate?.duplicateOf) && distinct !== null && !distinct.duplicateOf,
    duplicate
      ? `parafraza istniejącego argumentu rozpoznana przy podobieństwie ${duplicate.similarity.toFixed(3)} wobec progu ${duplicate.threshold}, treść odrębna przepuszczona przy ${distinct ? distinct.similarity.toFixed(3) : "brak"}`
      : "brak odpowiedzi z porównania semantycznego",
  );

  // --- WF10: rejestr modeli (potrzebny do WF7..WF9) ---
  const providers = await must("rejestr modeli", api("/ai/providers"));
  const modelIds = providers.map((p) => p.id);
  const unknownModel = await api("/ai/arguments/generate", {
    method: "POST",
    token: alice.token,
    body: {
      debateId: debate.id,
      side: "pro",
      modelId: "model/nieistniejacy",
    },
  });

  // --- WF7: generowanie przesłanki w kontekście grafu ---
  const generated = [];
  for (const model of providers) {
    const res = await api("/ai/arguments/generate", {
      method: "POST",
      token: alice.token,
      body: {
        debateId: debate.id,
        side: "against",
        modelId: model.id,
        parentContent: root.content,
      },
    });
    generated.push({
      model: model.id,
      ok: res.ok,
      length: res.ok ? res.json.content.length : 0,
      returnedModel: res.ok ? res.json.modelId : null,
      status: res.status,
    });
  }
  record(
    "WF7",
    "Wygenerowanie propozycji przesłanki w kontekście grafu",
    generated.every((g) => g.ok && g.length > 0),
    `${generated.filter((g) => g.ok).length} z ${generated.length} modeli zwróciło niepustą przesłankę, długości ${generated.map((g) => g.length).join(", ")} znaków`,
  );

  record(
    "WF10",
    "Wybór modelu spośród zarejestrowanych",
    modelIds.length > 0 &&
      generated.every((g) => g.ok && g.returnedModel === g.model) &&
      unknownModel.status >= 400,
    `rejestr zwraca ${modelIds.length} modeli (${modelIds.join(", ")}), każde wywołanie odpowiada identyfikatorem żądanego modelu, identyfikator nieznany odrzucony kodem ${unknownModel.status}`,
  );

  // --- WF8: sygnalizowanie niezgodności ze stroną sporu ---
  const mismatch = await must(
    "niezgodna strona",
    api("/ai/arguments/check-side", {
      method: "POST",
      token: alice.token,
      body: {
        debateId: debate.id,
        selectedSide: "pro",
        content:
          "Zajęcia zdalne obniżają jakość kształcenia, bo studenci nie mają kontaktu z prowadzącym ani z laboratorium.",
      },
    }),
  );
  const agreement = await must(
    "zgodna strona",
    api("/ai/arguments/check-side", {
      method: "POST",
      token: alice.token,
      body: {
        debateId: debate.id,
        selectedSide: "pro",
        content:
          "Zajęcia zdalne pozwalają łączyć studia z pracą zawodową, co zwiększa dostępność kształcenia.",
      },
    }),
  );
  record(
    "WF8",
    "Sygnalizowanie niezgodności treści z zadeklarowaną stroną",
    mismatch.isMismatch === true && agreement.isMismatch === false,
    `treść przeciwna zgłoszona jako niezgodna z podpowiedzią strony ${mismatch.suggestedSide}, treść zgodna przepuszczona bez ostrzeżenia`,
  );

  // --- WF9: synteza podgrafu oraz całej debaty ---
  const all = await must("argumenty do syntezy", api(`/debates/${debate.id}/arguments`));
  const subgraph = [child.id, grandchild.id];
  const synthSub = await must(
    "synteza podgrafu",
    api("/ai/synthesize", {
      method: "POST",
      token: alice.token,
      body: { debateId: debate.id, argumentIds: subgraph, modelId: modelIds[0] },
    }),
  );
  const synthAll = await must(
    "synteza całej debaty",
    api("/ai/synthesize", {
      method: "POST",
      token: alice.token,
      body: {
        debateId: debate.id,
        argumentIds: all.map((a) => a.id),
        modelId: modelIds[0],
      },
    }),
  );
  record(
    "WF9",
    "Synteza wskazanego podgrafu oraz całej debaty",
    synthSub.text.length > 0 &&
      synthAll.text.length > 0 &&
      synthSub.text !== synthAll.text,
    `synteza dwuwęzłowego podgrafu ${synthSub.text.length} znaków, synteza ${all.length} węzłów ${synthAll.text.length} znaków, wyniki różne; sam gest lassa rozstrzyga warstwa kliencka`,
  );

  // --- WF11: debaty publiczne i grupy prywatne z zaproszeniami ---
  const group = await must(
    "utworzenie grupy",
    api("/groups", {
      method: "POST",
      token: alice.token,
      body: { name: `Grupa weryfikacyjna ${STAMP}` },
    }),
  );
  const invitation = await must(
    "zaproszenie",
    api(`/groups/${group.id}/invitations`, {
      method: "POST",
      token: alice.token,
      body: { inviteeId: bob.id },
    }),
  );
  const privateDebate = await must(
    "debata prywatna",
    api("/debates", {
      method: "POST",
      token: alice.token,
      body: {
        thesis: "Grupa seminaryjna powinna publikować protokoły ze spotkań.",
        visibility: "private",
        groupId: group.id,
      },
    }),
  );
  const beforeAccept = await api(`/debates/${privateDebate.id}`, {
    token: bob.token,
  });
  await must(
    "przyjęcie zaproszenia",
    api(`/invitations/${invitation.id}/accept`, {
      method: "POST",
      token: bob.token,
    }),
  );
  const afterAccept = await api(`/debates/${privateDebate.id}`, {
    token: bob.token,
  });
  const outsider = await api(`/debates/${privateDebate.id}`, {
    token: carol.token,
  });
  const anonymousPublic = await api(`/debates/${debate.id}`);
  const anonymousWrite = await api(`/debates/${debate.id}/arguments`, {
    method: "POST",
    body: { side: "pro", content: "Próba zapisu bez uwierzytelnienia." },
  });
  record(
    "WF11",
    "Debaty publiczne oraz grupy prywatne z zaproszeniami",
    beforeAccept.status >= 400 &&
      afterAccept.ok &&
      outsider.status >= 400 &&
      anonymousPublic.ok &&
      anonymousWrite.status === 401,
    `zaproszony przed akceptacją ${beforeAccept.status}, po akceptacji ${afterAccept.status}, osoba spoza grupy ${outsider.status}, debata publiczna czytana anonimowo ${anonymousPublic.status}, zapis anonimowy ${anonymousWrite.status}`,
  );

  // --- WF12: wycofanie z widoku bez usunięcia trwałego ---
  const argsBefore = await must(
    "argumenty przed wycofaniem",
    api(`/debates/${debate.id}/arguments`),
  );
  await must(
    "wycofanie argumentu",
    api(`/arguments/${grandchild.id}`, { method: "DELETE", token: alice.token }),
  );
  const argsAfter = await must(
    "argumenty po wycofaniu",
    api(`/debates/${debate.id}/arguments`),
  );
  await must(
    "wycofanie debaty",
    api(`/debates/${english.id}`, { method: "DELETE", token: alice.token }),
  );
  const debateAfter = await api(`/debates/${english.id}`);
  const listAfter = await must("lista debat", api("/debates"));
  record(
    "WF12",
    "Zachowanie danych po wycofaniu z widoku",
    argsBefore.length - argsAfter.length === 1 &&
      debateAfter.status >= 400 &&
      !listAfter.some((d) => d.id === english.id),
    `argument zniknął z zasobu (${argsBefore.length} → ${argsAfter.length}), wycofana debata zwraca ${debateAfter.status} i nie występuje na liście; obecność wierszy w bazie sprawdza zapytanie SQL wypisane poniżej`,
  );

  console.log(
    `\nSprawdzenie trwałości wierszy (wykonać na bazie testowej):\n` +
      `  SELECT id, archived_on FROM arguments WHERE id = '${grandchild.id}';\n` +
      `  SELECT id, archived_on FROM debates   WHERE id = '${english.id}';\n`,
  );

  fs.writeFileSync(
    path.resolve(OUT_PATH),
    JSON.stringify(
      {
        api: API,
        executedAt: new Date().toISOString(),
        debateId: debate.id,
        archivedArgumentId: grandchild.id,
        archivedDebateId: english.id,
        providers,
        generated,
        results,
      },
      null,
      2,
    ),
    "utf8",
  );

  const failed = results.filter((r) => r.ok === false);
  console.log(
    `\nSpełnione: ${results.filter((r) => r.ok === true).length}, ` +
      `poza zakresem skryptu: ${results.filter((r) => r.ok === null).length}, ` +
      `niespełnione: ${failed.length}\n`,
  );
  console.log(`Surowy wynik: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(`\nPrzerwano: ${err.message}`);
  process.exit(1);
});
