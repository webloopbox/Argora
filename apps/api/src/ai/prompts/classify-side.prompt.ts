import { DebateLanguage } from '@brainstorm/core';
import type { ClassifySideInput } from '../llm-provider.interface';

/**
 * Builds the user prompt that asks an LLM which side the new argument takes.
 *
 * The question is always asked in the same frame the user picked the side in:
 * against the immediate parent when the argument is a reply, against the thesis
 * when it hangs straight off the root. Asking about the thesis for a nested
 * reply is what this prompt used to do, and it was unreliable: the model only
 * sees the immediate parent, so deciding a thesis-relative side several levels
 * down requires walking a chain it was never given, and it falls back to
 * surface wording ("opens access to a global market" reads pro-thesis even when
 * the argument attacks its parent). Comparing two texts is a judgement the
 * model can actually make, and its answer is then the local side directly - no
 * polarity algebra, nothing to keep in sync with `effectiveStance`.
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
  if (input.parentContent) {
    return [
      `Kontekst (teza całej debaty, wyłącznie tło): "${input.thesis}"`,
      '',
      `Twierdzenie nadrzędne: "${input.parentContent}"`,
      `Nowa wypowiedź: "${input.content}"`,
      '',
      'Czy nowa wypowiedź POPIERA (wzmacnia, uzasadnia, rozwija) TWIERDZENIE',
      'NADRZĘDNE, czy je OBALA (podważa, osłabia, zaprzecza mu)?',
      'Oceniaj wyłącznie relację do twierdzenia nadrzędnego, nie do tezy debaty.',
      'Odpowiedz TYLKO jednym słowem: "ZA" lub "PRZECIW".',
    ].join('\n');
  }

  return [
    `Teza debaty: "${input.thesis}"`,
    `Nowy argument użytkownika: "${input.content}"`,
    '',
    'Czy nowy argument POPIERA czy OBALA tezę?',
    'Odpowiedz TYLKO jednym słowem: "ZA" lub "PRZECIW".',
  ].join('\n');
}

function buildEnglishPrompt(input: ClassifySideInput): string {
  if (input.parentContent) {
    return [
      `Context (the debate's thesis, background only): "${input.thesis}"`,
      '',
      `Parent claim: "${input.parentContent}"`,
      `New statement: "${input.content}"`,
      '',
      'Does the new statement SUPPORT (reinforce, justify, extend) the PARENT',
      'CLAIM, or REFUTE it (undermine, weaken, contradict it)?',
      'Judge only the relation to the parent claim, not to the debate thesis.',
      'Answer with ONE word only: "FOR" or "AGAINST".',
    ].join('\n');
  }

  return [
    `Debate thesis: "${input.thesis}"`,
    `The user's new argument: "${input.content}"`,
    '',
    'Does the new argument SUPPORT or REFUTE the thesis?',
    'Answer with ONE word only: "FOR" or "AGAINST".',
  ].join('\n');
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
