import { join } from 'path';
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
  // Schema is now owned by migrations (src/database/migrations) — never
  // set this to true outside a throwaway local DB, it can silently
  // alter/drop columns with no history or rollback.
  synchronize: configService.get<boolean>('db.synchronize'),
  migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  // Dev-only convenience (mirrors db.synchronize's split) — run migrations
  // automatically on boot. In any shared/production environment, run
  // `pnpm migration:run` as a deliberate, reviewed deploy step instead.
  migrationsRun: configService.get<boolean>('db.migrationsRun'),
});
