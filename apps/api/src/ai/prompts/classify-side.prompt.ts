import type { ClassifySideInput } from '../llm-provider.interface';

/**
 * Builds the user prompt that asks an LLM to decide which side of the debate
 * an argument logically supports.  When the argument is a reply to a parent,
 * the parent's content is included so the model can judge whether the new
 * argument contradicts or supports that parent (and therefore which side of
 * the thesis it falls on).
 *
 * The model is constrained to a single-word answer so the response can be
 * parsed deterministically by `parseSide`.
 */
export function buildClassifySidePrompt(input: ClassifySideInput): string {
  const lines: string[] = [
    `Teza debaty: "${input.thesis}"`,
  ];

  if (input.parentContent) {
    lines.push(`Argument nadrzędny (na który użytkownik odpowiada): "${input.parentContent}"`);
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

/**
 * Maps a raw LLM classification response to a side.
 *
 * Returns `null` when neither keyword is found so the caller can treat an
 * ambiguous response as "no opinion" and skip the mismatch warning — this is
 * safer than defaulting to one side and surfacing a spurious dialog.
 */
export function parseSide(raw: string): 'pro' | 'against' | null {
  const normalised = raw.trim().toUpperCase();
  const hasAgainst = normalised.includes('PRZECIW');
  const hasFor = normalised.includes('ZA');

  // Both or neither → ambiguous; bail out.
  if (hasAgainst === hasFor) return null;

  return hasAgainst ? 'against' : 'pro';
}
