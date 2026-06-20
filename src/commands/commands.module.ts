import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Command } from './entities/command.entity';
import { UserCommand } from './entities/user-command.entity';
import { CommandsService } from './commands.service';

@Module({
  imports: [TypeOrmModule.forFeature([Command, UserCommand])],
  providers: [CommandsService],
  exports: [CommandsService],
})
export class CommandsModule {}
