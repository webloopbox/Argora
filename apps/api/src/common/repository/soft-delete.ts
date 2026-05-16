import { FindOptionsWhere, IsNull, Repository } from 'typeorm';

// Every row that represents debate data carries `archivedOn: Date | null`.
// Read paths must filter out archived rows, archive paths must set the
// timestamp rather than DELETE. `activeWhere` and `softArchive` centralise
// both, so services never reach for `.delete` or forget the filter.

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

export async function softArchive<T extends SoftDeletable>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>,
  archivedAt: Date = new Date(),
): Promise<number> {
  const result = await repo.update(
    { ...where, archivedOn: IsNull() } as FindOptionsWhere<T>,
    { archivedOn: archivedAt } as never,
  );
  return result.affected ?? 0;
}
