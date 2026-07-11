import type { GenerateInput } from '../llm-provider.interface';

/**
 * Builds the user prompt that asks an LLM to draft a single new argument for
 * one side of the debate. When the argument is a reply to a parent, the model
 * is told to argue for/against that parent specifically; otherwise it argues
 * for/against the thesis.
 *
 * Shared by every provider so the wording (and output language) stays
 * identical regardless of vendor.
 */
export function buildGeneratePrompt(input: GenerateInput): string {
  const stance = input.side === 'pro' ? 'in favour of' : 'against';
  const target = input.parentContent ? 'the argument above' : 'this thesis';
  const parentCtx = input.parentContent
    ? `\nYou are replying to an existing argument: "${input.parentContent}"\n`
    : '';

  return (
    `Debate thesis: "${input.thesis}"\n` +
    parentCtx +
    `Generate one concise argument ${stance} ${target}. ` +
    `Return ONLY the argument text — no preamble, numbering, meta-commentary or quotation marks. ` +
    `Maximum 3 sentences. Write in English.`
  );
}
