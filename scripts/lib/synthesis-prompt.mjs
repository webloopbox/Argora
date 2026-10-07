// The Polish variant of apps/api/src/ai/prompts/synthesis.prompt.ts, kept as a
// standalone copy so an evaluation run can build exactly the prompt the API
// would send without booting the API. It backs the measurements reported in
// praca_pisemna.md 7.5 and 7.6, so it must not be reworded in place: a changed
// prompt makes those runs unreproducible.
import { truncate } from "./debate-model.mjs";

const PARENT_PREVIEW_MAX = 140; // apps/api/src/ai/prompts/synthesis.prompt.ts

const SIDE_LABEL = { pro: "ZA TEZĄ", against: "PRZECIW TEZIE" };
const SENTIMENT_LABEL = {
  pro: "przewaga głosów za",
  against: "przewaga głosów przeciw",
  controversy: "sporny (głosy podzielone)",
  neutral: "brak głosów",
};

// Kopia polskiego wariantu buildSynthesisPrompt, identyczna z użytą w §7.5.
export function buildSynthesisPrompt(thesis, args) {
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
