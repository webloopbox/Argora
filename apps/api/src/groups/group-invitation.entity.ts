import { InvitationStatus } from '@argora/core';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// One pending invite per (group, invitee), declared below as a partial unique
// @Index - a TypeORM @Unique cannot carry the WHERE clause, an @Index can, and
// it belongs in the entity because `synchronize` drops every index it does not
// know about on each boot. The application-level check in InvitationsService
// is the primary guard and the DB index is the safety net.
@Entity('group_invitations')
@Index('group_invitations_one_pending_per_pair', ['groupId', 'inviteeId'], {
  unique: true,
  where: "status = 'pending' AND archived_on IS NULL",
})
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
