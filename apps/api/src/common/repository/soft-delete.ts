import { FindOptionsWhere, IsNull } from 'typeorm';

// Every row that represents debate data carries `archivedOn: Date | null`.
// Read paths must filter out archived rows, archive paths must set the
// timestamp rather than DELETE. `activeWhere` centralises the read side.
//
// What the type does and does not buy: `ActiveWhere` keeps `archivedOn`
// required and operator-valued, so a filter this helper built cannot be
// weakened downstream (`{ ...activeWhere(x), archivedOn: null }` is a type
// error). It does NOT force anyone to call the helper - `find({ where: { id } })`
// compiles fine and reads archived rows. Skipping it is caught in review, not
// by tsc, which is why every read here is written the same shape.
//
// Archiving stays in the services because every archive cascades to child rows
// inside one transaction, which a generic helper cannot express.

export interface SoftDeletable {
  archivedOn: Date | null;
}

export type ActiveWhere<T extends SoftDeletable> = FindOptionsWhere<T> & {
  archivedOn: ReturnType<typeof IsNull>;
};

export function activeWhere<T extends SoftDeletable>(
  where?: FindOptionsWhere<T>,
): ActiveWhere<T> {
  return {
    ...(where ?? {}),
    archivedOn: IsNull(),
  } as ActiveWhere<T>;
}
