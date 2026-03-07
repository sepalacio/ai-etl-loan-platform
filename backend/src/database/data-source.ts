/**
 * Standalone DataSource used exclusively by the TypeORM CLI (migration:generate,
 * migration:run, etc.). It runs outside the NestJS DI context, so we load .env
 * manually with dotenv and read env vars directly.
 *
 * The NestJS app uses its own TypeORM config in app.module.ts — keep both in sync.
 */
import { config } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';

config(); // load .env from process.cwd() (the backend root)

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5433', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'loanpro',
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'migrations',
});
