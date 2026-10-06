import { ArgumentSide } from '@brainstorm/core';

/**
 * A node's stored `side` is relative to its immediate parent (Kialo-style
 * nesting), so it must never be read as a thesis-relative label: an argument
 * several levels deep can locally read "pro" while actually opposing the
 * thesis. The thesis-relative value - the effective stance - is derived by
 * walking up to the root and flipping polarity on every Against link.
 *
 * Used by the synthesis prompt, which labels each entry FOR/AGAINST the thesis.
 * The side check does not go through here: it asks the model about the
 * immediate parent, so its verdict is already in the same frame as the user's
 * choice and needs no polarity conversion.
 */
export interface StanceNode {
  side: ArgumentSide;
  parentArgumentId: string | null;
}

// Guards against a cycle introduced by corrupt data; real trees are far shallower.
const MAX_HOPS = 20;

/**
 * Effective (thesis-relative) stance of the node identified by `startId`.
 * A `null` start means "the thesis itself", which supports itself by definition.
 */
export function effectiveStance(
  startId: string | null,
  lookup: (id: string) => StanceNode | undefined,
): ArgumentSide {
  let pro = true;
  let currentId: string | null = startId;
  let hops = 0;

  while (currentId && hops < MAX_HOPS) {
    const node = lookup(currentId);
    if (!node) break;
    if (node.side === ArgumentSide.Against) pro = !pro;
    currentId = node.parentArgumentId;
    hops++;
  }

  return pro ? ArgumentSide.Pro : ArgumentSide.Against;
}
