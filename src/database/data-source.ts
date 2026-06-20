import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

// Standalone DataSource used only by the TypeORM CLI (migration:generate/
// run/revert). The Nest app itself uses src/config/database.config.ts via
// TypeOrmModule.forRootAsync — kept separate because the CLI runs outside
// Nest's DI container and can't use ConfigService.
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
});
