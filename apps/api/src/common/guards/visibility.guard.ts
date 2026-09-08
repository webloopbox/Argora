import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DebateVisibility } from '@brainstorm/core';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Argument } from '../../arguments/argument.entity';
import { Debate } from '../../debates/debate.entity';
import { GroupMembership } from '../../groups/group-membership.entity';
import { User } from '../../users/user.entity';
import { activeWhere } from '../repository/soft-delete';

// Centralises read/write access to a single debate. Every controller that
// touches debate-scoped data must wrap its handler in this guard - never
// re-check visibility inline. The debate id is looked up from the route
// params (`:debateId` or `:id`), then from `:argumentId` by resolving the
// argument's own debate (vote routes hang off the argument, not the debate),
// and finally from the request body (`debateId`) so AI endpoints carrying the
// id in the body share the gate.
//
// Decision matrix:
//   public debate   + anonymous caller     -> allow (read)
//   public debate   + authenticated caller -> allow (read or write)
//   private debate  + member               -> allow
//   private debate  + non-member           -> 403
//   missing debate                         -> 404
//
// The guard attaches the resolved `Debate` to `req.debate` so handlers
// don't need to fetch it again.

export interface RequestWithDebate extends Request {
  debate?: Debate;
  user?: User;
}

@Injectable()
export class VisibilityGuard implements CanActivate {
  constructor(
    @InjectRepository(Debate)
    private readonly debates: Repository<Debate>,
    @InjectRepository(GroupMembership)
    private readonly memberships: Repository<GroupMembership>,
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithDebate>();
    const debateId = await this.resolveDebateId(req);
    if (!debateId) {
      throw new NotFoundException('Nie wskazano debaty.');
    }

    const debate = await this.debates.findOne({
      where: activeWhere<Debate>({ id: debateId }),
    });
    if (!debate) {
      throw new NotFoundException('Debata nie istnieje.');
    }

    if (debate.visibility === DebateVisibility.Public) {
      req.debate = debate;
      return true;
    }

    const userId = req.user?.id;
    if (!userId || !debate.groupId) {
      throw new ForbiddenException('Brak dostępu do tej debaty');
    }

    const membership = await this.memberships.findOne({
      where: activeWhere<GroupMembership>({
        groupId: debate.groupId,
        userId,
      }),
    });
    if (!membership) {
      throw new ForbiddenException('Brak dostępu do tej debaty');
    }

    req.debate = debate;
    return true;
  }

  private async resolveDebateId(
    req: RequestWithDebate,
  ): Promise<string | undefined> {
    const params = req.params as Record<string, string | undefined>;
    if (params.debateId ?? params.id) return params.debateId ?? params.id;

    // Vote routes are scoped on the argument (`/arguments/:argumentId/votes`),
    // so the debate has to be reached through it. Resolving it here keeps the
    // access rule in this guard instead of a second copy in VotesService.
    if (params.argumentId) {
      const argument = await this.args.findOne({
        where: activeWhere<Argument>({ id: params.argumentId }),
        select: ['id', 'debateId'],
      });
      if (!argument) {
        throw new NotFoundException('Argument nie istnieje.');
      }
      return argument.debateId;
    }

    const body = req.body as { debateId?: string } | undefined;
    return body?.debateId;
  }
}
