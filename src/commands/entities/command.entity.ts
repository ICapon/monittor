import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'commands' })
export class Command {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  description!: string;

  // Printed verbatim when the command runs — always rendered via
  // textContent on the client, never innerHTML, so this is safe even
  // though it's admin-authored rather than user input.
  @Column({ type: 'text' })
  response!: string;

  // Soft-disable: flipping this to false revokes the command from every
  // grantee immediately, without touching user_commands rows.
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
