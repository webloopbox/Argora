import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { StatsDto } from '@brainstorm/core';
import { Repository } from 'typeorm';
import { Argument } from '../arguments/argument.entity';
import { activeWhere } from '../common/repository/soft-delete';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { Vote } from '../votes/vote.entity';

const CACHE_TTL_MS = 60 * 1000;

@Injectable()
export class StatsService {
  private cached: { value: StatsDto; expiresAt: number } | null = null;

  constructor(
    @InjectRepository(Debate) private readonly debates: Repository<Debate>,
    @InjectRepository(Argument) private readonly args: Repository<Argument>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Vote) private readonly votes: Repository<Vote>,
  ) {}

  async get(): Promise<StatsDto> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) return this.cached.value;

    const [activeDebates, participants, argCount, voteCount] =
      await Promise.all([
        this.debates.count({ where: activeWhere<Debate>() }),
        this.users.count({ where: activeWhere<User>() }),
        this.args.count({ where: activeWhere<Argument>() }),
        this.votes.count({ where: activeWhere<Vote>() }),
      ]);

    const value: StatsDto = {
      activeDebates,
      participants,
      arguments: argCount,
      votes: voteCount,
    };
    this.cached = { value, expiresAt: now + CACHE_TTL_MS };
    return value;
  }
}
