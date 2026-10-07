import { DebateLanguage } from '@argora/core';
import type {
  SynthesizeArgInput,
  SynthesizeInput,
} from '../llm-provider.interface';

const PARENT_PREVIEW_MAX = 140;

/**
 * Every language-dependent fragment of the synthesis prompt. The assembly
 * order lives in `buildSynthesisPrompt` alone, so a change to the prompt
 * structure cannot land in one language and silently miss the other - which
 * is exactly how this prompt drifted into being English-only in the first
 * place.
 */
interface SynthesisCopy {
  /** Bracketed stance tag; includes the noun phrase so each language keeps its own case. */
  sideLabel: Record<string, string>;
  sentimentLabel: Record<string, string>;
  thesisLine: (thesis: string) => string;
  entriesHeader: (count: number) => string;
  replyLine: (agrees: boolean, parentPreview: string) => string;
  votesLine: (arg: SynthesizeArgInput, sentiment: string) => string;
  authoritativeTag: string;
  checklistIntro: string;
  checklistEntry: (author: string, weight: number) => string;
  checklistEmpty: string;
  checklistForLine: (names: string) => string;
  checklistAgainstLine: (names: string) => string;
  task: string;
  headingRule: string;
  sections: string;
  closing: string;
}

const POLISH: SynthesisCopy = {
  sideLabel: { pro: 'ZA TEZĄ', against: 'PRZECIW TEZIE' },
  sentimentLabel: {
    pro: 'przewaga głosów za',
    against: 'przewaga głosów przeciw',
    controversy: 'sporny (głosy podzielone)',
    neutral: 'brak głosów',
  },
  thesisLine: (thesis) => `Teza debaty: "${thesis}"`,
  // Phrased as "liczba argumentów: N" to sidestep Polish numeral declension,
  // which would otherwise need three variants for 1 / 2-4 / 5+.
  entriesHeader: (count) =>
    `Wymiana argumentów w zaznaczonej części dyskusji (liczba argumentów: ${count}):`,
  replyLine: (agrees, parentPreview) =>
    `\n   W odpowiedzi na (${agrees ? 'zgadza się z' : 'polemizuje z'}): "${parentPreview}"`,
  votesLine: (arg, sentiment) =>
    `\n   Głosy: ${arg.forCount} za, ${arg.againstCount} przeciw ` +
    `(waga ${arg.weight}, sentyment: ${sentiment})`,
  authoritativeTag:
    'Znacznik w nawiasie kwadratowym przy każdym wpisie podaje już jego ostateczne ' +
    'stanowisko wobec tezy (wyznaczone przez cały łańcuch odpowiedzi, a nie tylko ' +
    'przez bezpośredniego rodzica). Traktuj go jako wiążący.',
  checklistIntro:
    'Lista kontrolna pokrycia. Każde nazwisko z poniższej listy musi pojawić się, pod ' +
    'własnym nazwiskiem autora, we właściwej sekcji i tylko tam. Dwa różne wpisy mogą ' +
    'przypadkiem mieć tego samego autora albo tę samą wagę, co NIE czyni ich tym samym ' +
    'argumentem. Nigdy nie łącz dwóch różnych autorów w jedną wzmiankę, nigdy nie ' +
    'przypisuj treści jednego autora do nazwiska innego i nigdy nie pomijaj po cichu ' +
    'nazwiska z tej listy:',
  checklistEntry: (author, weight) => `${author} (waga ${weight})`,
  checklistEmpty: '(brak)',
  checklistForLine: (names) => `  ZA tezą: ${names}`,
  checklistAgainstLine: (names) => `  PRZECIW tezie: ${names}`,
  task: 'Zadanie: napisz rozbudowane streszczenie tego kontekstu po polsku, sformatowane jako Markdown.',
  headingRule:
    'Użyj dokładnie tych pięciu nagłówków sekcji, każdy zapisany dosłownie jako nagłówek ' +
    'Markdown trzeciego poziomu ("### " i zaraz po nim dokładny tytuł podany niżej, w ' +
    'osobnym wierszu). Nie zastępuj nagłówka pogrubieniem, nie dodawaj, nie usuwaj, nie ' +
    'zmieniaj kolejności ani nie przeformułowuj tytułów:',
  sections:
    `### O co toczy się spór\n` +
    `1-2 zdania o tym, czego dotyczy zaznaczona część dyskusji.\n\n` +
    `### Argumenty za\n` +
    `Uwzględnij każdego autora z powyższej listy "ZA tezą", co najmniej jedną frazą na ` +
    `osobę, odwołując się do autora i wagi głosów (np. "Anna K. (waga 6) zwraca uwagę, ` +
    `że…"). Pisz zwięźle, ale długość ma wynikać z rozmiaru listy kontrolnej. Nie skracaj ` +
    `przez pominięcie nazwiska.\n\n` +
    `### Argumenty przeciw\n` +
    `Analogicznie uwzględnij każdego autora z powyższej listy "PRZECIW tezie".\n\n` +
    `### Linie sporu\n` +
    `Wskaż główne punkty tarcia, w tym argumenty oznaczone jako "sporny". 1-2 zdania.\n\n` +
    `### Punkty wspólne i pytania otwarte\n` +
    `Jeśli uczestnicy się w czymś zgadzają, wskaż to. Jeśli nie, sformułuj 1-2 pytania ` +
    `otwarte wynikające z dyskusji. 1-2 zdania.`,
  closing:
    'Pisz konkretnie, unikaj ogólników. Odwołuj się do treści argumentów, nie powtarzaj ' +
    'ich dosłownie 1:1.',
};

const ENGLISH: SynthesisCopy = {
  sideLabel: { pro: 'FOR the thesis', against: 'AGAINST the thesis' },
  sentimentLabel: {
    pro: 'mostly For',
    against: 'mostly Against',
    controversy: 'contested (votes split)',
    neutral: 'no votes',
  },
  thesisLine: (thesis) => `Debate thesis: "${thesis}"`,
  entriesHeader: (count) =>
    `Exchange of arguments in the selected part of the discussion (${count} arguments):`,
  replyLine: (agrees, parentPreview) =>
    `\n   In reply to (${agrees ? 'agrees with' : 'disagrees with'}): "${parentPreview}"`,
  votesLine: (arg, sentiment) =>
    `\n   Votes: ${arg.forCount} for, ${arg.againstCount} against ` +
    `(weight ${arg.weight}, sentiment: ${sentiment})`,
  authoritativeTag:
    "Each entry's bracketed tag already states its resolved stance toward the thesis " +
    '(computed through the full reply chain, not just the immediate parent) - treat it ' +
    'as authoritative.',
  checklistIntro:
    'Coverage checklist - every name below must appear, by its own author name, in the ' +
    'matching section, and only there. Two different entries may share an author or a ' +
    'weight number by coincidence - that does NOT make them the same argument. Never ' +
    "merge two different authors into one mention, never move one author's content onto " +
    "another author's name, and never silently drop a name from this checklist:",
  checklistEntry: (author, weight) => `${author} (weight ${weight})`,
  checklistEmpty: '(none)',
  checklistForLine: (names) => `  FOR the thesis: ${names}`,
  checklistAgainstLine: (names) => `  AGAINST the thesis: ${names}`,
  task: 'Task: write an extended summary of this context in English, formatted as Markdown.',
  headingRule:
    'Use exactly these five section headings, each written literally as a level-3 ' +
    'Markdown heading ("### " followed by the exact title below, on its own line) - do ' +
    'not use bold text in place of a heading, do not add, remove, reorder, or reword the ' +
    'titles:',
  sections:
    `### What's at stake\n` +
    `1-2 sentences on what the selected part of the discussion is about.\n\n` +
    `### Arguments for\n` +
    `Cover every author from the "FOR the thesis" checklist above, at least one clause ` +
    `each, referring to author and vote weight (e.g. "Anna K. (weight 6) points out ` +
    `that…"). Keep it concise, but length follows the checklist size - do not shorten by ` +
    `dropping a name.\n\n` +
    `### Arguments against\n` +
    `Likewise, cover every author from the "AGAINST the thesis" checklist above.\n\n` +
    `### Lines of tension\n` +
    `Identify the main points of friction, including arguments marked as "contested". ` +
    `1-2 sentences.\n\n` +
    `### Common ground / open questions\n` +
    `If the participants agree on something, point it out. If not, formulate 1-2 open ` +
    `questions that emerge from the discussion. 1-2 sentences.`,
  closing:
    "Be specific, avoid platitudes. Refer to the substance of the arguments, don't " +
    'restate them verbatim 1:1.',
};

const COPY: Record<DebateLanguage, SynthesisCopy> = {
  [DebateLanguage.Pl]: POLISH,
  [DebateLanguage.En]: ENGLISH,
};

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Builds the user prompt for the "selected-context synthesis". Encodes not just
 * argument bodies but also authors, voting weights, sentiment and the
 * parent-argument relation - so the LLM can write a context-aware summary
 * instead of bullet-paraphrasing each entry.
 *
 * The [FOR]/[AGAINST] tag shown per entry is `effectiveStance` (resolved against the
 * debate thesis), not the raw `side` field - `side` is only relative to the immediate
 * parent, so tagging entries with it directly would mislabel any argument nested under
 * an odd number of "against" replies.
 *
 * Output language follows the debate, so a Polish debate is summarised in
 * Polish. The five section headings are localised too; nothing downstream
 * parses them, they exist to keep the report's shape stable across models.
 */
export function buildSynthesisPrompt(input: SynthesizeInput): string {
  const copy = COPY[input.lang];

  const entries = input.arguments
    .map((arg, idx) => {
      const stance =
        copy.sideLabel[arg.effectiveStance] ??
        arg.effectiveStance.toUpperCase();
      const sentiment = copy.sentimentLabel[arg.sentiment] ?? arg.sentiment;
      const replyLine = arg.parentContent
        ? copy.replyLine(
            arg.side !== 'against',
            truncate(arg.parentContent, PARENT_PREVIEW_MAX),
          )
        : '';
      return (
        `${idx + 1}. [${stance}] ${arg.author} - "${arg.content}"` +
        replyLine +
        copy.votesLine(arg, sentiment)
      );
    })
    .join('\n\n');

  // Ground-truth answer key for who belongs on which side. Without this, models
  // reliably drop authors or fuse two different people into one under length
  // pressure - especially when two entries happen to share the same weight number
  // (e.g. two unrelated arguments both weighing 6 get merged into a single mention).
  const checklist = (stance: 'pro' | 'against') =>
    input.arguments
      .filter((arg) => arg.effectiveStance === stance)
      .map((arg) => copy.checklistEntry(arg.author, arg.weight))
      .join(', ') || copy.checklistEmpty;

  return (
    `${copy.thesisLine(input.thesis)}\n\n` +
    `${copy.entriesHeader(input.arguments.length)}\n\n` +
    `${entries}\n\n` +
    `${copy.authoritativeTag}\n\n` +
    `${copy.checklistIntro}\n` +
    `${copy.checklistForLine(checklist('pro'))}\n` +
    `${copy.checklistAgainstLine(checklist('against'))}\n\n` +
    `${copy.task}\n\n` +
    `${copy.headingRule}\n\n` +
    `${copy.sections}\n\n` +
    `${copy.closing}`
  );
}
