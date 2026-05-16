import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

// Group + Invitation entities and the management endpoints land in
// Partia 6. The membership table itself is created here so that
// VisibilityGuard can already query it (empty == every private debate is
// 403 until Partia 6 populates rows, which is the intended behaviour).
@Entity('group_memberships')
@Unique('group_memberships_group_user_uq', ['groupId', 'userId'])
export class GroupMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  @Index()
  groupId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt!: Date;

  @Column({
    name: 'archived_on',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  @Index()
  archivedOn!: Date | null;
}
