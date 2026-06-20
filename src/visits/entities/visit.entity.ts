import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

// One row per visitor (keyed by the visitor_id cookie, see home.controller.ts)
// — every page load upserts this row instead of inserting a new one, so the
// table stays roughly one row per browser, not one row per page view.
@Entity({ name: 'visits' })
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  visitorId!: string;

  // Nullable: most hits are anonymous. Once a visitor logs in from a given
  // browser, we keep remembering the link even on later anonymous hits from
  // the same cookie (see VisitsService.recordVisit).
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  userId?: string | null;

  @Column({ type: 'varchar', length: 45 })
  ip!: string;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'varchar', length: 100 })
  browser!: string;

  @Column({ type: 'varchar', length: 100 })
  engine!: string;

  @Column({ type: 'varchar', length: 100 })
  os!: string;

  @Column({ type: 'varchar', length: 100 })
  device!: string;

  @Column({ type: 'varchar', length: 100 })
  language!: string;

  @Column({ type: 'varchar', length: 500 })
  referer!: string;

  @Column({ type: 'text' })
  userAgent!: string;

  @Column({ type: 'varchar', length: 255 })
  lastPath!: string;

  @Column({ type: 'int', default: 1 })
  visitCount!: number;

  // First seen.
  @CreateDateColumn()
  createdAt!: Date;

  // Last seen — touched on every upsert.
  @UpdateDateColumn()
  updatedAt!: Date;
}
