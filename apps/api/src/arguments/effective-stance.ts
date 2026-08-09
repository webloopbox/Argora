import { ArgumentSide } from '@brainstorm/core';

/**
 * A node's stored `side` is relative to its immediate parent (Kialo-style
 * nesting), so it must never be read as a thesis-relative label: an argument
 * several levels deep can locally read "pro" while actually opposing the
 * thesis. The thesis-relative value - the effective stance - is derived by
 * walking up to the root and flipping polarity on every Against link.
 *
 * Shared by the synthesis prompt (which labels each entry FOR/AGAINST the
 * thesis) and by the side check (which compares a thesis-relative model
 * verdict against a parent-relative user choice). Keeping one implementation
 * matters: the two used to disagree, and the side check reported a mismatch
 * for every reply supporting an anti-thesis argument.
 */
export interface StanceNode {
  side: ArgumentSide;
  parentArgumentId: string | null;
}

// Guards against a cycle introduced by corrupt data; real trees are far shallower.
const MAX_HOPS = 20;

export function flipSide(side: ArgumentSide): ArgumentSide {
  return side === ArgumentSide.Pro ? ArgumentSide.Against : ArgumentSide.Pro;
}

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

/**
 * Thesis-relative stance implied by picking `localSide` under a parent whose
 * own effective stance is `parentStance`. Supporting an anti-thesis argument
 * argues against the thesis, and attacking one argues for it.
 */
export function impliedEffectiveStance(
  localSide: ArgumentSide,
  parentStance: ArgumentSide | null,
): ArgumentSide {
  if (parentStance === null) return localSide;
  return localSide === ArgumentSide.Pro ? parentStance : flipSide(parentStance);
}

/** Inverse of {@link impliedEffectiveStance}: the local side that yields `target`. */
export function localSideFor(
  target: ArgumentSide,
  parentStance: ArgumentSide | null,
): ArgumentSide {
  if (parentStance === null) return target;
  return target === parentStance ? ArgumentSide.Pro : ArgumentSide.Against;
}
