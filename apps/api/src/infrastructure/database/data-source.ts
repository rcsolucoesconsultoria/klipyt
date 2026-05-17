import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { resolveEnvPath } from '../../config/resolve-env-path';

dotenv.config({ path: resolveEnvPath() });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'klipyt_admin',
  password: process.env.DB_PASS || 'klipyt_strong_password',
  database: process.env.DB_NAME || 'klipyt_prod',
  entities: [join(__dirname, '../../domain/entities/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, './migrations/**/*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
