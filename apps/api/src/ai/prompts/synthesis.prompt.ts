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
 */
export function buildSynthesisPrompt(input: SynthesizeInput): string {
  const entries = input.arguments
    .map((arg, idx) => {
      const side = SIDE_LABEL[arg.side] ?? arg.side.toUpperCase();
      const sentiment = SENTIMENT_LABEL[arg.sentiment] ?? arg.sentiment;
      const replyLine = arg.parentContent
        ? `\n   In reply to: "${truncate(arg.parentContent, PARENT_PREVIEW_MAX)}"`
        : '';
      return (
        `${idx + 1}. [${side}] ${arg.author} - "${arg.content}"` +
        replyLine +
        `\n   Votes: ${arg.forCount} for, ${arg.againstCount} against ` +
        `(weight ${arg.weight}, sentiment: ${sentiment})`
      );
    })
    .join('\n\n');

  return (
    `Debate thesis: "${input.thesis}"\n\n` +
    `Exchange of arguments in the selected part of the discussion ` +
    `(${input.arguments.length} arguments):\n\n` +
    `${entries}\n\n` +
    `Task: write an extended summary of this context in English. ` +
    `Keep the following structure with Markdown headings:\n\n` +
    `**What's at stake** - 1-2 sentences on what the selected part of the discussion is about.\n\n` +
    `**Arguments for** - list the strongest points of the For side, referring to the authors ` +
    `and vote weight (e.g. "Anna K. points out that…"). 2-3 sentences.\n\n` +
    `**Arguments against** - likewise for the Against side. 2-3 sentences.\n\n` +
    `**Lines of tension** - identify the main points of friction, including arguments marked as "contested". ` +
    `1-2 sentences.\n\n` +
    `**Common ground / open questions** - if the participants agree on something, ` +
    `point it out. If not, formulate 1-2 open questions that emerge from the discussion. ` +
    `1-2 sentences.\n\n` +
    `Be specific, avoid platitudes. Refer to the substance of the arguments, don't restate them ` +
    `verbatim 1:1.`
  );
}
