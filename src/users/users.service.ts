import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

const BCRYPT_COST_FACTOR = 12;

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.count();
    if (existing > 0) return;

    const username = this.configService.get<string>('seedAdmin.username');
    const password = this.configService.get<string>('seedAdmin.password');
    if (!username || !password) {
      this.logger.warn(
        'No users exist and SEED_ADMIN_USERNAME/SEED_ADMIN_PASSWORD are not set — skipping seed.',
      );
      return;
    }

    await this.createUser(username, password);
    this.logger.log(
      `Seeded initial admin user "${username}". Change this password after first login.`,
    );
  }

  count(): Promise<number> {
    return this.usersRepository.count();
  }

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
      select: { id: true, username: true, passwordHash: true },
    });
  }

  async createUser(username: string, plaintextPassword: string): Promise<User> {
    const passwordHash = await bcrypt.hash(plaintextPassword, BCRYPT_COST_FACTOR);
    const user = this.usersRepository.create({ username, passwordHash });
    return this.usersRepository.save(user);
  }
}
