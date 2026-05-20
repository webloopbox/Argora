import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArgumentDto,
  ArgumentSentiment,
  CreateArgumentDto,
} from '@brainstorm/core';
import { In, Repository } from 'typeorm';
import { activeWhere } from '../common/repository/soft-delete';
import { EmbeddingService } from '../ai/embedding.service';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { Vote } from '../votes/vote.entity';
import { Argument } from './argument.entity';

// Threshold below which a non-zero weight argument flips from a clear
// pro/against majority to the orange `controversy` sentiment. Reserved for
// the controversy badge per CLAUDE.md - kept as a named constant so future
// tuning is a single edit.
const CONTROVERSY_MAX_RATIO = 0.2;

interface VoteCountRow {
  argumentId: string;
  value: number;
  count: number;
}

@Injectable()
export class ArgumentsService {
  private readonly logger = new Logger(ArgumentsService.name);

  constructor(
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    private readonly embedding: EmbeddingService,
  ) {}

  async create(
    debate: Debate,
    author: User,
    input: CreateArgumentDto,
  ): Promise<ArgumentDto> {
    let parentId: string | null = null;
    if (input.parentArgumentId) {
      const parent = await this.args.findOne({
        where: activeWhere<Argument>({ id: input.parentArgumentId }),
      });
      if (!parent || parent.debateId !== debate.id) {
        throw new BadRequestException(
          'Wskazany argument nadrzędny nie istnieje w tej debacie.',
        );
      }
      parentId = parent.id;
    }

    const created = this.args.create({
      debateId: debate.id,
      parentArgumentId: parentId,
      side: input.side,
      content: input.content.trim(),
      authorId: author.id,
      isAiGenerated: input.isAiGenerated ?? false,
      embedding: null,
      archivedOn: null,
    });
    const saved = await this.args.save(created);
    // Fire-and-forget: compute and store the embedding asynchronously so the
    // HTTP response is not blocked. Failures are logged but not retried.
    this.embedAsync(saved.id, saved.content);
    // Fresh argument has no votes yet — skip the aggregate query.
    return this.toDto(saved, author, { for: 0, against: 0 }, null);
  }

  async listForDebate(
    debate: Debate,
    caller?: User,
  ): Promise<ArgumentDto[]> {
    const args = await this.args.find({
      where: activeWhere<Argument>({ debateId: debate.id }),
      order: { createdAt: 'ASC' },
    });
    if (args.length === 0) return [];

    const authorIds = Array.from(new Set(args.map((a) => a.authorId)));
    const argIds = args.map((a) => a.id);

    const [authors, voteRows, userVoteRows] = await Promise.all([
      this.users.find({ where: { id: In(authorIds) } }),
      this.votes
        .createQueryBuilder('v')
        .select('v.argument_id', 'argumentId')
        .addSelect('v.value', 'value')
        .addSelect('COUNT(*)::int', 'count')
        .where('v.argument_id IN (:...ids)', { ids: argIds })
        .andWhere('v.archived_on IS NULL')
        .groupBy('v.argument_id, v.value')
        .getRawMany<VoteCountRow>(),
      caller
        ? this.votes.find({
            where: activeWhere<Vote>({
              userId: caller.id,
              argumentId: In(argIds),
            }),
          })
        : Promise.resolve([] as Vote[]),
    ]);

    const authorMap = new Map(authors.map((u) => [u.id, u]));
    const voteMap = this.buildVoteMap(voteRows);
    const userVoteMap = new Map<string, 1 | -1>(
      userVoteRows.map((v) => [v.argumentId, v.value]),
    );

    return args.map((arg) =>
      this.toDto(
        arg,
        authorMap.get(arg.authorId),
        voteMap.get(arg.id) ?? { for: 0, against: 0 },
        userVoteMap.get(arg.id) ?? null,
      ),
    );
  }

  // Used by VotesService after cast/retract to return the freshly recomputed
  // argument projection — saves the caller from a follow-up GET.
  async findById(argumentId: string, caller?: User): Promise<ArgumentDto> {
    const arg = await this.args.findOne({
      where: activeWhere<Argument>({ id: argumentId }),
    });
    if (!arg) throw new NotFoundException('Argument nie istnieje.');

    const [author, voteRows, callerVote] = await Promise.all([
      this.users.findOne({ where: { id: arg.authorId } }),
      this.votes
        .createQueryBuilder('v')
        .select('v.value', 'value')
        .addSelect('COUNT(*)::int', 'count')
        .where('v.argument_id = :id', { id: arg.id })
        .andWhere('v.archived_on IS NULL')
        .groupBy('v.value')
        .getRawMany<{ value: number; count: number }>(),
      caller
        ? this.votes.findOne({
            where: activeWhere<Vote>({
              argumentId: arg.id,
              userId: caller.id,
            }),
          })
        : Promise.resolve(null),
    ]);

    const counts = { for: 0, against: 0 };
    for (const row of voteRows) {
      if (row.value === 1) counts.for = row.count;
      else if (row.value === -1) counts.against = row.count;
    }

    return this.toDto(arg, author ?? undefined, counts, callerVote?.value ?? null);
  }

  async archive(argumentId: string, caller: User): Promise<void> {
    const arg = await this.args.findOne({
      where: activeWhere<Argument>({ id: argumentId }),
    });
    if (!arg) throw new NotFoundException('Argument nie istnieje.');
    if (arg.authorId !== caller.id) {
      throw new BadRequestException(
        'Tylko autor argumentu może go zarchiwizować.',
      );
    }
    arg.archivedOn = new Date();
    await this.args.save(arg);
  }

  private buildVoteMap(
    rows: VoteCountRow[],
  ): Map<string, { for: number; against: number }> {
    const map = new Map<string, { for: number; against: number }>();
    for (const row of rows) {
      const entry = map.get(row.argumentId) ?? { for: 0, against: 0 };
      if (row.value === 1) entry.for = row.count;
      else if (row.value === -1) entry.against = row.count;
      map.set(row.argumentId, entry);
    }
    return map;
  }

  private toDto(
    arg: Argument,
    author: User | undefined,
    counts: { for: number; against: number },
    userVote: 1 | -1 | null,
  ): ArgumentDto {
    const weight = counts.for + counts.against;
    return {
      id: arg.id,
      debateId: arg.debateId,
      parentArgumentId: arg.parentArgumentId,
      side: arg.side,
      content: arg.content,
      author: author
        ? { id: author.id, displayName: author.displayName }
        : { id: arg.authorId, displayName: '—' },
      isAiGenerated: arg.isAiGenerated,
      createdAt: arg.createdAt.toISOString(),
      forCount: counts.for,
      againstCount: counts.against,
      weight,
      sentiment: this.computeSentiment(counts.for, counts.against),
      userVote,
    };
  }

  private computeSentiment(forCount: number, againstCount: number): ArgumentSentiment {
    const weight = forCount + againstCount;
    if (weight === 0) return 'neutral';
    const balanceRatio = Math.abs(forCount - againstCount) / weight;
    if (balanceRatio < CONTROVERSY_MAX_RATIO) return 'controversy';
    return forCount >= againstCount ? 'pro' : 'against';
  }

  private embedAsync(argumentId: string, content: string): void {
    this.embedding
      .embed(content)
      .then(async (vec) => {
        if (!vec) return;
        await this.args.update({ id: argumentId }, { embedding: vec });
      })
      .catch((err: unknown) => {
        this.logger.error(`Embedding failed for argument ${argumentId}`, err);
      });
  }
}
