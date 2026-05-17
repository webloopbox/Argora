import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// At most one active vote per (argument, user) — enforced via partial
// unique index in db/init.sql (TypeORM @Unique can't express WHERE clauses).
// Retracting a vote soft-archives the row, so a fresh +1 after a -1 yields
// an audit trail of two rows but only the active one counts.
@Entity('votes')
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'argument_id', type: 'uuid' })
  @Index()
  argumentId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId!: string;

  // Stored as smallint rather than enum so SUM/COUNT queries stay trivial
  // and the value is self-describing (1 = pro, -1 = against).
  @Column({ type: 'smallint' })
  value!: 1 | -1;

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
