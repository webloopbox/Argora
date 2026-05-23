import { InvitationStatus } from '@brainstorm/core';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// One pending invite per (group, invitee) is enforced by a partial unique
// index created in db/init.sql - TypeORM can't express partial unique
// constraints declaratively, so the application-level check in
// InvitationsService is the primary guard and the DB index is the safety net.
@Entity('group_invitations')
@Index('group_invitations_group_invitee_status_idx', [
  'groupId',
  'inviteeId',
  'status',
])
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'group_id', type: 'uuid' })
  @Index()
  groupId!: string;

  @Column({ name: 'invitee_id', type: 'uuid' })
  @Index()
  inviteeId!: string;

  @Column({ name: 'inviter_id', type: 'uuid' })
  inviterId!: string;

  @Column({
    type: 'varchar',
    length: 16,
    enum: InvitationStatus,
    default: InvitationStatus.Pending,
  })
  @Index()
  status!: InvitationStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({
    name: 'responded_at',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  respondedAt!: Date | null;

  @Column({
    name: 'archived_on',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  @Index()
  archivedOn!: Date | null;
}
