import { ArgumentSide } from '@brainstorm/core';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Tree shape: `parentArgumentId IS NULL` means the argument hangs directly
// off the debate's thesis. Otherwise it is a counter-argument or refinement
// of another argument in the same debate.
@Entity('arguments')
export class Argument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'debate_id', type: 'uuid' })
  @Index()
  debateId!: string;

  @Column({
    name: 'parent_argument_id',
    type: 'uuid',
    nullable: true,
    default: null,
  })
  @Index()
  parentArgumentId!: string | null;

  @Column({ type: 'varchar', length: 16, enum: ArgumentSide })
  side!: ArgumentSide;

  @Column({ type: 'text' })
  content!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  @Index()
  authorId!: string;

  @Column({
    name: 'is_ai_generated',
    type: 'boolean',
    default: false,
  })
  isAiGenerated!: boolean;

  // Reserved for Partia 7c (duplicate detection). Stored as jsonb until the
  // semantic-search code lands, at which point this column is rewritten to
  // `vector(1536)` via a migration. pgvector is already enabled in the
  // database image so the migration is a single `ALTER COLUMN ... USING`.
  @Column({ name: 'embedding', type: 'jsonb', nullable: true, default: null })
  embedding!: number[] | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
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
