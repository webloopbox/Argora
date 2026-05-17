import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  CreateGroupDto,
  DebateVisibility,
  GroupDetailDto,
  GroupSummaryDto,
} from '@brainstorm/core';
import { DataSource, In, Repository } from 'typeorm';
import { Argument } from '../arguments/argument.entity';
import { activeWhere } from '../common/repository/soft-delete';
import { Debate } from '../debates/debate.entity';
import { User } from '../users/user.entity';
import { GroupInvitation } from './group-invitation.entity';
import { GroupMembership } from './group-membership.entity';
import { Group } from './group.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groups: Repository<Group>,
    @InjectRepository(GroupMembership)
    private readonly memberships: Repository<GroupMembership>,
    @InjectRepository(GroupInvitation)
    private readonly invitations: Repository<GroupInvitation>,
    @InjectRepository(Debate)
    private readonly debates: Repository<Debate>,
    @InjectRepository(Argument)
    private readonly args: Repository<Argument>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(owner: User, input: CreateGroupDto): Promise<GroupDetailDto> {
    const name = input.name.trim();
    if (name.length === 0) {
      throw new BadRequestException('Nazwa grupy nie może być pusta.');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const group = manager.create(Group, {
        name,
        ownerId: owner.id,
        archivedOn: null,
      });
      const savedGroup = await manager.save(group);
      const membership = manager.create(GroupMembership, {
        groupId: savedGroup.id,
        userId: owner.id,
        archivedOn: null,
      });
      await manager.save(membership);
      return savedGroup;
    });

    return this.toDetail(result, owner);
  }

  async listMine(callerId: string): Promise<GroupSummaryDto[]> {
    const memberships = await this.memberships.find({
      where: activeWhere<GroupMembership>({ userId: callerId }),
    });
    if (memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.groupId);
    const groups = await this.groups.find({
      where: activeWhere<Group>({ id: In(groupIds) }),
      order: { createdAt: 'DESC' },
    });
    return this.toSummaries(groups, callerId);
  }

  async findDetail(groupId: string, caller: User): Promise<GroupDetailDto> {
    const group = await this.getActiveOr404(groupId);
    await this.ensureMember(groupId, caller.id);

    const memberships = await this.memberships.find({
      where: activeWhere<GroupMembership>({ groupId }),
      order: { joinedAt: 'ASC' },
    });
    const userIds = memberships.map((m) => m.userId);
    const users = userIds.length
      ? await this.users.find({ where: { id: In(userIds) } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const owner = userMap.get(group.ownerId);
    const debateCount = await this.debates.count({
      where: activeWhere<Debate>({
        groupId,
        visibility: DebateVisibility.Private,
      }),
    });

    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      ownerDisplayName: owner?.displayName ?? '—',
      memberCount: memberships.length,
      debateCount,
      createdAt: group.createdAt.toISOString(),
      isOwner: group.ownerId === caller.id,
      members: memberships.map((m) => {
        const user = userMap.get(m.userId);
        return {
          id: m.userId,
          displayName: user?.displayName ?? '—',
          isOwner: m.userId === group.ownerId,
          joinedAt: m.joinedAt.toISOString(),
        };
      }),
    };
  }

  async archive(groupId: string, caller: User): Promise<void> {
    const group = await this.getActiveOr404(groupId);
    if (group.ownerId !== caller.id) {
      throw new ForbiddenException('Tylko właściciel może usunąć grupę.');
    }

    const now = new Date();
    await this.dataSource.transaction(async (manager) => {
      const debatesUpdate = await manager
        .createQueryBuilder()
        .update(Debate)
        .set({ archivedOn: now })
        .where('group_id = :groupId AND archived_on IS NULL', { groupId })
        .returning(['id'])
        .execute();
      const debateIds = (debatesUpdate.raw as Array<{ id: string }>).map(
        (r) => r.id,
      );
      if (debateIds.length > 0) {
        await manager
          .createQueryBuilder()
          .update(Argument)
          .set({ archivedOn: now })
          .where('debate_id IN (:...ids) AND archived_on IS NULL', {
            ids: debateIds,
          })
          .execute();
      }
      await manager
        .createQueryBuilder()
        .update(GroupMembership)
        .set({ archivedOn: now })
        .where('group_id = :groupId AND archived_on IS NULL', { groupId })
        .execute();
      await manager
        .createQueryBuilder()
        .update(GroupInvitation)
        .set({ archivedOn: now })
        .where('group_id = :groupId AND archived_on IS NULL', { groupId })
        .execute();
      await manager
        .createQueryBuilder()
        .update(Group)
        .set({ archivedOn: now })
        .where('id = :groupId AND archived_on IS NULL', { groupId })
        .execute();
    });
  }

  async ensureMember(groupId: string, userId: string): Promise<GroupMembership> {
    const membership = await this.memberships.findOne({
      where: activeWhere<GroupMembership>({ groupId, userId }),
    });
    if (!membership) {
      throw new ForbiddenException('Brak dostępu do tej grupy.');
    }
    return membership;
  }

  async ensureOwner(groupId: string, userId: string): Promise<Group> {
    const group = await this.getActiveOr404(groupId);
    if (group.ownerId !== userId) {
      throw new ForbiddenException(
        'Tę operację może wykonać tylko właściciel grupy.',
      );
    }
    return group;
  }

  async getActiveOr404(groupId: string): Promise<Group> {
    const group = await this.groups.findOne({
      where: activeWhere<Group>({ id: groupId }),
    });
    if (!group) {
      throw new NotFoundException('Grupa nie istnieje.');
    }
    return group;
  }

  // Used by the invitation flow after acceptance. Adds a fresh membership
  // and rejects duplicates with a 409 so the caller knows the user was
  // already in the group.
  async addMembership(groupId: string, userId: string): Promise<void> {
    const existing = await this.memberships.findOne({
      where: activeWhere<GroupMembership>({ groupId, userId }),
    });
    if (existing) {
      throw new ConflictException('Użytkownik jest już członkiem grupy.');
    }
    const membership = this.memberships.create({
      groupId,
      userId,
      archivedOn: null,
    });
    await this.memberships.save(membership);
  }

  private async toDetail(group: Group, owner: User): Promise<GroupDetailDto> {
    return {
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      ownerDisplayName: owner.displayName,
      memberCount: 1,
      debateCount: 0,
      createdAt: group.createdAt.toISOString(),
      isOwner: true,
      members: [
        {
          id: owner.id,
          displayName: owner.displayName,
          isOwner: true,
          joinedAt: group.createdAt.toISOString(),
        },
      ],
    };
  }

  private async toSummaries(
    groups: Group[],
    callerId: string,
  ): Promise<GroupSummaryDto[]> {
    if (groups.length === 0) return [];

    const groupIds = groups.map((g) => g.id);
    const ownerIds = Array.from(new Set(groups.map((g) => g.ownerId)));

    const [owners, memberCounts, debateCounts] = await Promise.all([
      this.users.find({ where: { id: In(ownerIds) } }),
      this.memberships
        .createQueryBuilder('m')
        .select('m.group_id', 'groupId')
        .addSelect('COUNT(*)::int', 'count')
        .where('m.group_id IN (:...ids)', { ids: groupIds })
        .andWhere('m.archived_on IS NULL')
        .groupBy('m.group_id')
        .getRawMany<{ groupId: string; count: number }>(),
      this.debates
        .createQueryBuilder('d')
        .select('d.group_id', 'groupId')
        .addSelect('COUNT(*)::int', 'count')
        .where('d.group_id IN (:...ids)', { ids: groupIds })
        .andWhere('d.archived_on IS NULL')
        .groupBy('d.group_id')
        .getRawMany<{ groupId: string; count: number }>(),
    ]);

    const ownerMap = new Map(owners.map((u) => [u.id, u]));
    const memberMap = new Map(memberCounts.map((r) => [r.groupId, r.count]));
    const debateMap = new Map(debateCounts.map((r) => [r.groupId, r.count]));

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      ownerId: group.ownerId,
      ownerDisplayName: ownerMap.get(group.ownerId)?.displayName ?? '—',
      memberCount: memberMap.get(group.id) ?? 0,
      debateCount: debateMap.get(group.id) ?? 0,
      createdAt: group.createdAt.toISOString(),
      isOwner: group.ownerId === callerId,
    }));
  }
}
