import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CreateDebateDto,
  DebateDetailDto,
  DebateLanguage,
  DebatePreviewDto,
  DebateVisibility,
} from '@argora/core';
import { DataSource, In, Repository } from 'typeorm';
import { Argument } from '../arguments/argument.entity';
import { activeWhere } from '../common/repository/soft-delete';
import { GroupMembership } from '../groups/group-membership.entity';
import { User } from '../users/user.entity';
import { Debate } from './debate.entity';

interface SideCounts {
  pro: number;
  against: number;
}

// Frozen for the same reason as NO_VOTES in ArgumentsService: it is returned
// to callers directly and `applySideRow` mutates its accumulator.
const NO_ARGUMENTS: SideCounts = Object.freeze({ pro: 0, against: 0 });

// `side` is a two-value enum, so a grouped count returns at most two rows per
// debate. Reading them in one place keeps the list and the detail projection
// from drifting apart on how a missing row is interpreted.
function applySideRow(
  counts: SideCounts,
  row: { side: string; count: number },
): SideCounts {
  if (row.side === 'pro') counts.pro = row.count;
  else if (row.side === 'against') counts.against = row.count;
  return counts;
}

function sideCountsOf(rows: { side: string; count: number }[]): SideCounts {
  return rows.reduce(applySideRow, { pro: 0, against: 0 });
}

function sideCountsByDebate(
  rows: { debateId: string; side: string; count: number }[],
): Map<string, SideCounts> {
  const map = new Map<string, SideCounts>();
  for (const row of rows) {
    map.set(
      row.debateId,
      applySideRow(map.get(row.debateId) ?? { pro: 0, against: 0 }, row),
    );
  }
  return map;
}

interface DebateWithAuthor {
  debate: Debate;
  author: Pick<User, 'id' | 'displayName'>;
}

@Injectable()
export class DebatesService {
  constructor(
    @InjectRepository(Debate)
    private readonly debates: Repository<Debate>,
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(GroupMembership)
    private readonly memberships: Repository<GroupMembership>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(author: User, input: CreateDebateDto): Promise<DebateDetailDto> {
    const isPrivate = input.visibility === DebateVisibility.Private;
    const groupId = input.groupId ?? null;

    if (isPrivate && !groupId) {
      throw new BadRequestException(
        'Debata prywatna musi być przypisana do grupy.',
      );
    }
    if (!isPrivate && groupId) {
      throw new BadRequestException(
        'Debata publiczna nie może być przypisana do grupy.',
      );
    }

    if (isPrivate && groupId) {
      const membership = await this.memberships.findOne({
        where: activeWhere<GroupMembership>({
          groupId,
          userId: author.id,
        }),
      });
      if (!membership) {
        throw new ForbiddenException('Nie należysz do wskazanej grupy.');
      }
    }

    const debate = this.debates.create({
      thesis: input.thesis.trim(),
      visibility: input.visibility,
      language: input.language ?? DebateLanguage.Pl,
      authorId: author.id,
      groupId,
      archivedOn: null,
    });
    const saved = await this.debates.save(debate);
    return this.toDetail({
      debate: saved,
      author: { id: author.id, displayName: author.displayName },
    });
  }

  async listPublic(): Promise<DebatePreviewDto[]> {
    const debates = await this.debates.find({
      where: activeWhere<Debate>({ visibility: DebateVisibility.Public }),
      order: { createdAt: 'DESC' },
      take: 100,
    });
    return this.attachAuthorsAndCounts(debates);
  }

  async listForGroup(
    groupId: string,
    callerId: string,
  ): Promise<DebatePreviewDto[]> {
    const membership = await this.memberships.findOne({
      where: activeWhere<GroupMembership>({ groupId, userId: callerId }),
    });
    if (!membership) {
      throw new ForbiddenException('Brak dostępu do tej grupy.');
    }

    const debates = await this.debates.find({
      where: activeWhere<Debate>({
        visibility: DebateVisibility.Private,
        groupId,
      }),
      order: { createdAt: 'DESC' },
      take: 200,
    });
    return this.attachAuthorsAndCounts(debates);
  }

  // VisibilityGuard already validated access and attached the debate to
  // the request. Service just returns the projection.
  async findDetail(debate: Debate): Promise<DebateDetailDto> {
    const author = await this.users.findOne({
      where: { id: debate.authorId },
    });
    if (!author) {
      throw new BadRequestException('Autor debaty został usunięty.');
    }
    return this.toDetail({
      debate,
      author: { id: author.id, displayName: author.displayName },
    });
  }

  async archive(debate: Debate, caller: User): Promise<void> {
    if (debate.authorId !== caller.id) {
      throw new ForbiddenException('Tylko autor może zarchiwizować debatę.');
    }
    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Debate)
        .set({ archivedOn: now })
        .where('id = :id AND archived_on IS NULL', { id: debate.id })
        .execute();
      await manager
        .createQueryBuilder()
        .update(Argument)
        .set({ archivedOn: now })
        .where('debate_id = :debateId AND archived_on IS NULL', {
          debateId: debate.id,
        })
        .execute();
    });
  }

  private async attachAuthorsAndCounts(
    debates: Debate[],
  ): Promise<DebatePreviewDto[]> {
    if (debates.length === 0) return [];

    const authorIds = Array.from(new Set(debates.map((d) => d.authorId)));
    const debateIds = debates.map((d) => d.id);

    const [authors, counts] = await Promise.all([
      this.users.find({ where: { id: In(authorIds) } }),
      this.args
        .createQueryBuilder('a')
        .select('a.debate_id', 'debateId')
        .addSelect('a.side', 'side')
        .addSelect('COUNT(*)::int', 'count')
        .where('a.debate_id IN (:...ids)', { ids: debateIds })
        .andWhere('a.archived_on IS NULL')
        .groupBy('a.debate_id, a.side')
        .getRawMany<{ debateId: string; side: string; count: number }>(),
    ]);

    const authorMap = new Map(authors.map((u) => [u.id, u]));
    const countMap = sideCountsByDebate(counts);

    return debates.map((debate) => {
      const author = authorMap.get(debate.authorId);
      const c = countMap.get(debate.id) ?? NO_ARGUMENTS;
      return {
        id: debate.id,
        thesis: debate.thesis,
        visibility: debate.visibility,
        language: debate.language,
        groupId: debate.groupId,
        author: author
          ? { id: author.id, displayName: author.displayName }
          : { id: debate.authorId, displayName: '-' },
        argumentCount: c.pro + c.against,
        proCount: c.pro,
        againstCount: c.against,
        createdAt: debate.createdAt.toISOString(),
      };
    });
  }

  private async toDetail(input: DebateWithAuthor): Promise<DebateDetailDto> {
    const rows = await this.args
      .createQueryBuilder('a')
      .select('a.side', 'side')
      .addSelect('COUNT(*)::int', 'count')
      .where('a.debate_id = :id', { id: input.debate.id })
      .andWhere('a.archived_on IS NULL')
      .groupBy('a.side')
      .getRawMany<{ side: string; count: number }>();
    const { pro, against } = sideCountsOf(rows);

    return {
      id: input.debate.id,
      thesis: input.debate.thesis,
      visibility: input.debate.visibility,
      language: input.debate.language,
      groupId: input.debate.groupId,
      author: input.author,
      argumentCount: pro + against,
      proCount: pro,
      againstCount: against,
      createdAt: input.debate.createdAt.toISOString(),
    };
  }
}
