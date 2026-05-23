import type { SynthesizeInput } from '../llm-provider.interface';

const SIDE_LABEL: Record<string, string> = {
  pro: 'ZA',
  against: 'PRZECIW',
};

const SENTIMENT_LABEL: Record<string, string> = {
  pro: 'przeważa Za',
  against: 'przeważa Przeciw',
  controversy: 'sporne (głosy podzielone)',
  neutral: 'brak głosów',
};

const PARENT_PREVIEW_MAX = 140;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

/**
 * Builds the user prompt for "streszczenie zaznaczonego kontekstu". Encodes
 * not just argument bodies but also authors, voting weights, sentiment and
 * the parent-argument relation — so the LLM can write a context-aware
 * summary instead of bullet-paraphrasing each entry.
 */
export function buildSynthesisPrompt(input: SynthesizeInput): string {
  const entries = input.arguments
    .map((arg, idx) => {
      const side = SIDE_LABEL[arg.side] ?? arg.side.toUpperCase();
      const sentiment = SENTIMENT_LABEL[arg.sentiment] ?? arg.sentiment;
      const replyLine = arg.parentContent
        ? `\n   W odpowiedzi na: "${truncate(arg.parentContent, PARENT_PREVIEW_MAX)}"`
        : '';
      return (
        `${idx + 1}. [${side}] ${arg.author} — "${arg.content}"` +
        replyLine +
        `\n   Głosy: ${arg.forCount} za, ${arg.againstCount} przeciw ` +
        `(waga ${arg.weight}, sentyment: ${sentiment})`
      );
    })
    .join('\n\n');

  return (
    `Teza debaty: "${input.thesis}"\n\n` +
    `Wymiana argumentów w zaznaczonym fragmencie dyskusji ` +
    `(${input.arguments.length} argumentów):\n\n` +
    `${entries}\n\n` +
    `Zadanie: przygotuj rozszerzone streszczenie tego kontekstu po polsku. ` +
    `Zachowaj poniższą strukturę z nagłówkami Markdown:\n\n` +
    `**O co toczy się spór** — 1–2 zdania o tym, czego dotyczy zaznaczona część dyskusji.\n\n` +
    `**Argumenty Za** — wymień najmocniejsze tezy strony Za, odwołując się do autorów ` +
    `i wagi głosów (np. "Anna K. zwraca uwagę, że…"). 2–3 zdania.\n\n` +
    `**Argumenty Przeciw** — analogicznie dla strony Przeciw. 2–3 zdania.\n\n` +
    `**Linie sporu** — wskaż główne punkty napięcia, w tym argumenty oznaczone jako "sporne". ` +
    `1–2 zdania.\n\n` +
    `**Wspólny grunt / otwarte pytania** — jeśli rozmówcy zgadzają się w jakimś punkcie, ` +
    `wskaż go. Jeśli nie — sformułuj 1–2 otwarte pytania, które wyłaniają się z dyskusji. ` +
    `1–2 zdania.\n\n` +
    `Pisz konkretnie, unikaj banałów. Odnoś się do treści argumentów, nie streszczaj ich ` +
    `dosłownie 1:1.`
  );
}
