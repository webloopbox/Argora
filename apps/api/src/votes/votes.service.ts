import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ArgumentDto,
  CastVoteDto,
  DebateVisibility,
  VoteValue,
} from '@brainstorm/core';
import { In, Repository } from 'typeorm';
import { Argument } from '../arguments/argument.entity';
import { ArgumentsService } from '../arguments/arguments.service';
import { activeWhere } from '../common/repository/soft-delete';
import { Debate } from '../debates/debate.entity';
import { GroupMembership } from '../groups/group-membership.entity';
import { User } from '../users/user.entity';
import { Vote } from './vote.entity';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votes: Repository<Vote>,
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(Debate)
    private readonly debates: Repository<Debate>,
    @InjectRepository(GroupMembership)
    private readonly memberships: Repository<GroupMembership>,
    private readonly argumentsService: ArgumentsService,
  ) {}

  async cast(
    argumentId: string,
    caller: User,
    input: CastVoteDto,
  ): Promise<ArgumentDto> {
    const argument = await this.resolveArgumentForCaller(argumentId, caller);

    const existing = await this.votes.findOne({
      where: activeWhere<Vote>({ argumentId, userId: caller.id }),
    });

    if (existing && existing.value === input.value) {
      // Idempotent: re-submitting the same value is a no-op.
      return this.argumentsService.findById(argument.id, caller);
    }

    if (existing) {
      existing.value = input.value;
      await this.votes.save(existing);
    } else {
      const vote = this.votes.create({
        argumentId,
        userId: caller.id,
        value: input.value as VoteValue,
        archivedOn: null,
      });
      await this.votes.save(vote);
    }

    return this.argumentsService.findById(argument.id, caller);
  }

  async retract(argumentId: string, caller: User): Promise<ArgumentDto> {
    const argument = await this.resolveArgumentForCaller(argumentId, caller);

    const existing = await this.votes.findOne({
      where: activeWhere<Vote>({ argumentId, userId: caller.id }),
    });
    if (existing) {
      existing.archivedOn = new Date();
      await this.votes.save(existing);
    }

    return this.argumentsService.findById(argument.id, caller);
  }

  // Mirror of VisibilityGuard but resolves through the argument id so we
  // don't need a /debates/:debateId/arguments/:id/votes route. Returns the
  // active argument or throws 404 / 403 with the same status codes the
  // guard uses for direct debate access.
  private async resolveArgumentForCaller(
    argumentId: string,
    caller: User,
  ): Promise<Argument> {
    const argument = await this.args.findOne({
      where: activeWhere<Argument>({ id: argumentId }),
    });
    if (!argument) {
      throw new NotFoundException('Argument nie istnieje.');
    }

    const debate = await this.debates.findOne({
      where: activeWhere<Debate>({ id: argument.debateId }),
    });
    if (!debate) {
      throw new NotFoundException('Debata nie istnieje.');
    }

    if (debate.visibility === DebateVisibility.Private && debate.groupId) {
      const membership = await this.memberships.findOne({
        where: activeWhere<GroupMembership>({
          groupId: debate.groupId,
          userId: caller.id,
        }),
      });
      if (!membership) {
        throw new ForbiddenException('Brak dostępu do tej debaty.');
      }
    }

    return argument;
  }
}
