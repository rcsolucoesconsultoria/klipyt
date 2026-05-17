import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../../../../.env') });

import { AppDataSource } from '../data-source';
import { seedPlatformSettings } from './platform-settings.seed';
import { seedEstablishments } from './establishments.seed';
import { seedStickers } from './stickers.seed';
import { seedBillboards } from './billboards.seed';
import Redis from 'ioredis';

async function run() {
  await AppDataSource.initialize();
  console.log('DB conectado. Iniciando seeds...');

  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  await seedPlatformSettings(AppDataSource);
  await seedEstablishments(AppDataSource, redis);
  await seedStickers(AppDataSource);
  await seedBillboards(AppDataSource, redis);

  await redis.quit();
  console.log('Seeds concluídos.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
