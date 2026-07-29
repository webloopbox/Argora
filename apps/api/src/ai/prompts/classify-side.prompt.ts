import { DebateLanguage } from '@brainstorm/core';
import type { ClassifySideInput } from '../llm-provider.interface';

/**
 * Builds the user prompt that asks an LLM to decide which side of the debate
 * an argument logically supports.  When the argument is a reply to a parent,
 * the parent's content is included so the model can judge whether the new
 * argument contradicts or supports that parent (and therefore which side of
 * the thesis it falls on).
 *
 * The prompt is written in the debate's own language: the model has to reason
 * about user-authored content, and asking in one language about text in
 * another measurably degrades the judgement on short, idiomatic arguments.
 *
 * The model is constrained to a single-word answer so the response can be
 * parsed deterministically by `parseSide`.
 */
export function buildClassifySidePrompt(input: ClassifySideInput): string {
  return input.lang === DebateLanguage.Pl
    ? buildPolishPrompt(input)
    : buildEnglishPrompt(input);
}

function buildPolishPrompt(input: ClassifySideInput): string {
  const lines: string[] = [`Teza debaty: "${input.thesis}"`];

  if (input.parentContent) {
    lines.push(
      `Argument nadrzędny (na który użytkownik odpowiada): "${input.parentContent}"`,
    );
  }

  lines.push(
    `Nowy argument użytkownika: "${input.content}"`,
    '',
    'Biorąc pod uwagę tezę debaty' +
      (input.parentContent ? ' oraz kontekst argumentu nadrzędnego' : '') +
      ', czy nowy argument POPIERA czy OBALA tezę?',
    'Odpowiedz TYLKO jednym słowem: "ZA" lub "PRZECIW".',
  );

  return lines.join('\n');
}

function buildEnglishPrompt(input: ClassifySideInput): string {
  const lines: string[] = [`Debate thesis: "${input.thesis}"`];

  if (input.parentContent) {
    lines.push(
      `Parent argument (the one the user is replying to): "${input.parentContent}"`,
    );
  }

  lines.push(
    `The user's new argument: "${input.content}"`,
    '',
    'Considering the debate thesis' +
      (input.parentContent ? ' and the context of the parent argument' : '') +
      ', does the new argument SUPPORT or REFUTE the thesis?',
    'Answer with ONE word only: "FOR" or "AGAINST".',
  );

  return lines.join('\n');
}

// Keyword sets for both languages are checked unconditionally rather than
// selected by `input.lang`. A model asked in one language occasionally answers
// in the other, and accepting both costs nothing: no keyword here is a
// substring of a keyword on the opposite side.
const FOR_KEYWORDS = ['ZA', 'FOR'];
const AGAINST_KEYWORDS = ['PRZECIW', 'AGAINST'];

/**
 * Maps a raw LLM classification response to a side.
 *
 * Returns `null` when neither keyword is found so the caller can treat an
 * ambiguous response as "no opinion" and skip the mismatch warning - this is
 * safer than defaulting to one side and surfacing a spurious dialog.
 */
export function parseSide(raw: string): 'pro' | 'against' | null {
  const normalised = raw.trim().toUpperCase();
  const hasAgainst = AGAINST_KEYWORDS.some((kw) => normalised.includes(kw));
  const hasFor = FOR_KEYWORDS.some((kw) => normalised.includes(kw));

  // Both or neither → ambiguous; bail out.
  if (hasAgainst === hasFor) return null;

  return hasAgainst ? 'against' : 'pro';
}
