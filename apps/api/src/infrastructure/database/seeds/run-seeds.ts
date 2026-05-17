import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { seedPlatformSettings } from './platform-settings.seed';

async function run() {
  await AppDataSource.initialize();
  console.log('DB conectado. Iniciando seeds...');
  await seedPlatformSettings(AppDataSource);
  console.log('Seeds concluídos.');
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
