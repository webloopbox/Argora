import { DebateVisibility } from '@brainstorm/core';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Visibility / groupId invariant: a debate is private iff it points at a
// group. Enforced at the DB level so no controller / service can ever
// persist an inconsistent row.
@Entity('debates')
@Check(
  'debates_visibility_group_consistency',
  `("visibility" = 'private' AND "group_id" IS NOT NULL) OR ` +
    `("visibility" = 'public' AND "group_id" IS NULL)`,
)
export class Debate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  thesis!: string;

  @Column({
    type: 'varchar',
    length: 16,
    enum: DebateVisibility,
  })
  @Index()
  visibility!: DebateVisibility;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index()
  authorId!: string;

  @Column({ name: 'group_id', type: 'uuid', nullable: true, default: null })
  @Index()
  groupId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({
    name: 'archived_on',
    type: 'timestamptz',
    nullable: true,
    default: null,
  })
  @Index()
  archivedOn!: Date | null;
}
