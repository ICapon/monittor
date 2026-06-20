import {
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Post,
  Req,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/middleware/auth.middleware';
import { CommandsService } from '../commands/commands.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

// Gated by AuthMiddleware, applied to POST /users from AppModule (not from
// this module) — see app.module.ts for why: AuthModule already imports
// UsersModule, so UsersModule importing AuthModule back would be circular.
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commandsService: CommandsService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ username: string }> {
    const granted = await this.commandsService.findAccessibleCommandsForUser(req.user!.sub);
    if (!granted.some((command) => command.name === 'adduser')) {
      throw new ForbiddenException('You do not have permission to add users.');
    }

    try {
      const user = await this.usersService.createUser(dto.username, dto.password);
      return { username: user.username };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('username already taken');
      }
      throw error;
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  );
}
