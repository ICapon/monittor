import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Command } from './entities/command.entity';
import { UserCommand } from './entities/user-command.entity';

export interface AccessibleCommand {
  name: string;
  response: string;
}

@Injectable()
export class CommandsService {
  private readonly logger = new Logger(CommandsService.name);

  constructor(
    @InjectRepository(Command)
    private readonly commandsRepository: Repository<Command>,
    @InjectRepository(UserCommand)
    private readonly userCommandsRepository: Repository<UserCommand>,
  ) {}

  async findAccessibleCommandsForUser(userId: string): Promise<AccessibleCommand[]> {
    const grants = await this.userCommandsRepository.find({
      where: { userId, command: { enabled: true } },
      relations: { command: true },
    });
    return grants.map((grant) => ({
      name: grant.command.name,
      response: grant.command.response,
    }));
  }

  // Idempotent — safe to call on every boot. Used to grant the seeded admin
  // its starting commands; the command row itself must already exist
  // (seeded via a migration, see src/database/migrations).
  async grantCommandToUser(userId: string, commandName: string): Promise<void> {
    const command = await this.commandsRepository.findOne({ where: { name: commandName } });
    if (!command) {
      this.logger.warn(`Cannot grant unknown command "${commandName}" — no such row in commands.`);
      return;
    }

    const alreadyGranted = await this.userCommandsRepository.exists({
      where: { userId, commandId: command.id },
    });
    if (alreadyGranted) return;

    const grant = this.userCommandsRepository.create({ userId, commandId: command.id });
    await this.userCommandsRepository.save(grant);
  }
}
