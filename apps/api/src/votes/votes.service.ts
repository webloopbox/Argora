import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArgumentDto, CastVoteDto } from '@brainstorm/core';
import { Repository } from 'typeorm';
import { ArgumentsService } from '../arguments/arguments.service';
import { activeWhere } from '../common/repository/soft-delete';
import { User } from '../users/user.entity';
import { Vote } from './vote.entity';

// Access is settled before the request reaches this service: VisibilityGuard
// resolves the debate through `:argumentId` and 404s an argument that does not
// exist or has been archived, so nothing here re-checks visibility.
@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    private readonly argumentsService: ArgumentsService,
  ) {}

  async cast(
    argumentId: string,
    caller: User,
    input: CastVoteDto,
  ): Promise<ArgumentDto> {
    const existing = await this.votes.findOne({
      where: activeWhere<Vote>({ argumentId, userId: caller.id }),
    });

    if (existing && existing.value === input.value) {
      // Idempotent: re-submitting the same value is a no-op.
      return this.argumentsService.findById(argumentId, caller);
    }

    if (existing) {
      existing.value = input.value;
      await this.votes.save(existing);
    } else {
      const vote = this.votes.create({
        argumentId,
        userId: caller.id,
        value: input.value,
        archivedOn: null,
      });
      await this.votes.save(vote);
    }

    return this.argumentsService.findById(argumentId, caller);
  }

  async retract(argumentId: string, caller: User): Promise<ArgumentDto> {
    const existing = await this.votes.findOne({
      where: activeWhere<Vote>({ argumentId, userId: caller.id }),
    });
    if (existing) {
      existing.archivedOn = new Date();
      await this.votes.save(existing);
    }

    return this.argumentsService.findById(argumentId, caller);
  }
}
