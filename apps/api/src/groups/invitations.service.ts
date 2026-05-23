import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CreateInvitationDto,
  InvitationDto,
  InvitationStatus,
} from '@brainstorm/core';
import { DataSource, In, Repository } from 'typeorm';
import { activeWhere } from '../common/repository/soft-delete';
import { User } from '../users/user.entity';
import { GroupInvitation } from './group-invitation.entity';
import { GroupMembership } from './group-membership.entity';
import { Group } from './group.entity';
import { GroupsService } from './groups.service';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(GroupInvitation)
    private readonly invitations: Repository<GroupInvitation>,
    @InjectRepository(GroupMembership)
    private readonly memberships: Repository<GroupMembership>,
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly groupsService: GroupsService,
  ) {}

  async create(
    groupId: string,
    inviter: User,
    input: CreateInvitationDto,
  ): Promise<InvitationDto> {
    const group = await this.groupsService.ensureOwner(groupId, inviter.id);

    if (input.inviteeId === inviter.id) {
      throw new BadRequestException('Nie możesz zaprosić samego siebie.');
    }

    const invitee = await this.users.findOne({
      where: { id: input.inviteeId },
    });
    if (!invitee || invitee.archivedOn !== null) {
      throw new NotFoundException('Wskazany użytkownik nie istnieje.');
    }

    const existingMembership = await this.memberships.findOne({
      where: activeWhere<GroupMembership>({
        groupId,
        userId: input.inviteeId,
      }),
    });
    if (existingMembership) {
      throw new ConflictException('Ten użytkownik jest już członkiem grupy.');
    }

    const existingPending = await this.invitations.findOne({
      where: activeWhere<GroupInvitation>({
        groupId,
        inviteeId: input.inviteeId,
        status: InvitationStatus.Pending,
      }),
    });
    if (existingPending) {
      throw new ConflictException(
        'Ten użytkownik ma już oczekujące zaproszenie do tej grupy.',
      );
    }

    const invitation = this.invitations.create({
      groupId,
      inviteeId: input.inviteeId,
      inviterId: inviter.id,
      status: InvitationStatus.Pending,
      respondedAt: null,
      archivedOn: null,
    });
    const saved = await this.invitations.save(invitation);

    return this.toDto(saved, {
      group,
      inviter,
      invitee,
    });
  }

  async listForCaller(callerId: string): Promise<InvitationDto[]> {
    const invitations = await this.invitations.find({
      where: activeWhere<GroupInvitation>({
        inviteeId: callerId,
        status: InvitationStatus.Pending,
      }),
      order: { createdAt: 'DESC' },
    });
    return this.hydrate(invitations);
  }

  async listForGroup(groupId: string, caller: User): Promise<InvitationDto[]> {
    await this.groupsService.ensureOwner(groupId, caller.id);
    const invitations = await this.invitations.find({
      where: activeWhere<GroupInvitation>({ groupId }),
      order: { createdAt: 'DESC' },
    });
    return this.hydrate(invitations);
  }

  async respond(
    invitationId: string,
    callerId: string,
    accept: boolean,
  ): Promise<InvitationDto> {
    const invitation = await this.invitations.findOne({
      where: activeWhere<GroupInvitation>({ id: invitationId }),
    });
    if (!invitation) {
      throw new NotFoundException('Zaproszenie nie istnieje.');
    }
    if (invitation.inviteeId !== callerId) {
      throw new ForbiddenException('Tylko zaproszony może odpowiedzieć.');
    }
    if (invitation.status !== InvitationStatus.Pending) {
      throw new ConflictException('To zaproszenie zostało już rozpatrzone.');
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(GroupInvitation)
        .set({
          status: accept
            ? InvitationStatus.Accepted
            : InvitationStatus.Declined,
          respondedAt: now,
        })
        .where('id = :id AND status = :pending', {
          id: invitation.id,
          pending: InvitationStatus.Pending,
        })
        .execute();

      if (accept) {
        const existing = await manager.findOne(GroupMembership, {
          where: activeWhere<GroupMembership>({
            groupId: invitation.groupId,
            userId: invitation.inviteeId,
          }),
        });
        if (!existing) {
          const membership = manager.create(GroupMembership, {
            groupId: invitation.groupId,
            userId: invitation.inviteeId,
            archivedOn: null,
          });
          await manager.save(membership);
        }
      }
    });

    const refreshed = await this.invitations.findOne({
      where: { id: invitation.id },
    });
    return (await this.hydrate(refreshed ? [refreshed] : []))[0];
  }

  private async hydrate(
    invitations: GroupInvitation[],
  ): Promise<InvitationDto[]> {
    if (invitations.length === 0) return [];

    const groupIds = Array.from(new Set(invitations.map((i) => i.groupId)));
    const userIds = Array.from(
      new Set(invitations.flatMap((i) => [i.inviterId, i.inviteeId])),
    );

    const [groups, users] = await Promise.all([
      this.groups.find({ where: { id: In(groupIds) } }),
      this.users.find({ where: { id: In(userIds) } }),
    ]);
    const groupMap = new Map(groups.map((g) => [g.id, g]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return invitations.map((invitation) => {
      const group = groupMap.get(invitation.groupId);
      const inviter = userMap.get(invitation.inviterId);
      const invitee = userMap.get(invitation.inviteeId);
      return this.toDto(invitation, {
        group: group ?? {
          id: invitation.groupId,
          name: '-',
        },
        inviter: inviter ?? { id: invitation.inviterId, displayName: '-' },
        invitee: invitee ?? { id: invitation.inviteeId, displayName: '-' },
      });
    });
  }

  private toDto(
    invitation: GroupInvitation,
    refs: {
      group: { id: string; name: string };
      inviter: { id: string; displayName: string };
      invitee: { id: string; displayName: string };
    },
  ): InvitationDto {
    return {
      id: invitation.id,
      status: invitation.status,
      group: { id: refs.group.id, name: refs.group.name },
      inviter: {
        id: refs.inviter.id,
        displayName: refs.inviter.displayName,
      },
      invitee: {
        id: refs.invitee.id,
        displayName: refs.invitee.displayName,
      },
      createdAt: invitation.createdAt.toISOString(),
      respondedAt: invitation.respondedAt
        ? invitation.respondedAt.toISOString()
        : null,
    };
  }
}
