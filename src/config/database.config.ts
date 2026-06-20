import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('db.host'),
  port: configService.get<number>('db.port'),
  username: configService.get<string>('db.username'),
  password: configService.get<string>('db.password'),
  database: configService.get<string>('db.name'),
  autoLoadEntities: true,
  // Only ever true in local dev (see .env.example) — never in a shared
  // environment, since it can silently alter/drop columns with no
  // migration history. Use TypeORM migrations once this matters.
  synchronize: configService.get<boolean>('db.synchronize'),
});
