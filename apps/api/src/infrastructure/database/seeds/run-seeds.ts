import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedPlatformSettings } from './platform-settings.seed';
import { seedEstablishments } from './establishments.seed';
import { seedStickers } from './stickers.seed';

async function run() {
  await AppDataSource.initialize();
  console.log('DB conectado. Iniciando seeds...');
  await seedPlatformSettings(AppDataSource);
  await seedEstablishments(AppDataSource);
  await seedStickers(AppDataSource);
  console.log('Seeds concluídos.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
