import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Command } from './command.entity';

// Grant table: which commands a given user has access to. Unidirectional —
// User stays untouched, this entity is the only thing that knows about the
// relationship.
@Entity({ name: 'user_commands' })
@Index(['userId', 'commandId'], { unique: true })
export class UserCommand {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Command, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'commandId' })
  command!: Command;

  @Column()
  commandId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
