import type { SynthesizeInput } from '../llm-provider.interface';

const SIDE_LABEL: Record<string, string> = {
  pro: 'FOR',
  against: 'AGAINST',
};

const SENTIMENT_LABEL: Record<string, string> = {
  pro: 'mostly For',
  against: 'mostly Against',
  controversy: 'contested (votes split)',
  neutral: 'no votes',
};

const PARENT_PREVIEW_MAX = 140;

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
 */
export function buildSynthesisPrompt(input: SynthesizeInput): string {
  const entries = input.arguments
    .map((arg, idx) => {
      const stance =
        SIDE_LABEL[arg.effectiveStance] ?? arg.effectiveStance.toUpperCase();
      const sentiment = SENTIMENT_LABEL[arg.sentiment] ?? arg.sentiment;
      const replyLine = arg.parentContent
        ? `\n   In reply to (${arg.side === 'against' ? 'disagrees with' : 'agrees with'}): "${truncate(arg.parentContent, PARENT_PREVIEW_MAX)}"`
        : '';
      return (
        `${idx + 1}. [${stance} the thesis] ${arg.author} - "${arg.content}"` +
        replyLine +
        `\n   Votes: ${arg.forCount} for, ${arg.againstCount} against ` +
        `(weight ${arg.weight}, sentiment: ${sentiment})`
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
      .map((arg) => `${arg.author} (weight ${arg.weight})`)
      .join(', ') || '(none)';
  const proChecklist = checklist('pro');
  const againstChecklist = checklist('against');

  return (
    `Debate thesis: "${input.thesis}"\n\n` +
    `Exchange of arguments in the selected part of the discussion ` +
    `(${input.arguments.length} arguments):\n\n` +
    `${entries}\n\n` +
    `Each entry's bracketed tag already states its resolved stance toward the ` +
    `thesis (computed through the full reply chain, not just the immediate parent) ` +
    `- treat it as authoritative.\n\n` +
    `Coverage checklist - every name below must appear, by its own author name, in the ` +
    `matching section, and only there. Two different entries may share an author or a ` +
    `weight number by coincidence - that does NOT make them the same argument. Never ` +
    `merge two different authors into one mention, never move one author's content onto ` +
    `another author's name, and never silently drop a name from this checklist:\n` +
    `  FOR the thesis: ${proChecklist}\n` +
    `  AGAINST the thesis: ${againstChecklist}\n\n` +
    `Task: write an extended summary of this context in English, formatted as Markdown.\n\n` +
    `Use exactly these five section headings, each written literally as a level-3 ` +
    `Markdown heading ("### " followed by the exact title below, on its own line) - ` +
    `do not use bold text in place of a heading, do not add, remove, reorder, or reword ` +
    `the titles:\n\n` +
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
    `questions that emerge from the discussion. 1-2 sentences.\n\n` +
    `Be specific, avoid platitudes. Refer to the substance of the arguments, don't restate them ` +
    `verbatim 1:1.`
  );
}
