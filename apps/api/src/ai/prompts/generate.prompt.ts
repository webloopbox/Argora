import { DebateLanguage } from '@brainstorm/core';
import type { GenerateInput } from '../llm-provider.interface';

/**
 * Builds the user prompt that asks an LLM to draft a single new argument for
 * one side of the debate. When the argument is a reply to a parent, the model
 * is told to argue for/against that parent specifically; otherwise it argues
 * for/against the thesis.
 *
 * Shared by every provider so the wording stays identical regardless of
 * vendor. The output language follows the debate, not the caller's interface
 * locale - a generated premise is persisted as a node in the graph, so writing
 * it in the wrong language would permanently mix languages inside one tree.
 */
export function buildGeneratePrompt(input: GenerateInput): string {
  return input.lang === DebateLanguage.Pl
    ? buildPolishPrompt(input)
    : buildEnglishPrompt(input);
}

function buildPolishPrompt(input: GenerateInput): string {
  // "popierający"/"obalający" plus an accusative object keeps one grammatical
  // frame for all four side/target combinations - phrasings built around
  // "za"/"przeciw" would need a different case in each branch.
  const stance = input.side === 'pro' ? 'popierający' : 'obalający';
  const target = input.parentContent ? 'powyższy argument' : 'tę tezę';
  const parentCtx = input.parentContent
    ? `\nOdpowiadasz na istniejący argument: "${input.parentContent}"\n`
    : '';

  return (
    `Teza debaty: "${input.thesis}"\n` +
    parentCtx +
    `Sformułuj jeden zwięzły argument ${stance} ${target}. ` +
    `Zwróć WYŁĄCZNIE treść argumentu, bez wstępu, numeracji, komentarza odautorskiego ani cudzysłowów. ` +
    `Maksymalnie 3 zdania. Pisz po polsku.`
  );
}

function buildEnglishPrompt(input: GenerateInput): string {
  const stance = input.side === 'pro' ? 'in favour of' : 'against';
  const target = input.parentContent ? 'the argument above' : 'this thesis';
  const parentCtx = input.parentContent
    ? `\nYou are replying to an existing argument: "${input.parentContent}"\n`
    : '';

  return (
    `Debate thesis: "${input.thesis}"\n` +
    parentCtx +
    `Generate one concise argument ${stance} ${target}. ` +
    `Return ONLY the argument text - no preamble, numbering, meta-commentary or quotation marks. ` +
    `Maximum 3 sentences. Write in English.`
  );
}
