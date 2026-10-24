import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// At most one active vote per (argument, user), declared below as a partial
// unique @Index: the rule has to be scoped to `WHERE archived_on IS NULL`,
// which a TypeORM @Unique cannot express but an @Index can. It belongs in the
// entity rather than in raw SQL, because `synchronize` drops every index it
// does not know about on each boot.
// Retracting a vote soft-archives the row, so a fresh +1 after a -1 yields
// an audit trail of two rows but only the active one counts.
@Entity('votes')
@Index('votes_one_active_per_pair', ['argumentId', 'userId'], {
  unique: true,
  where: 'archived_on IS NULL',
})
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
