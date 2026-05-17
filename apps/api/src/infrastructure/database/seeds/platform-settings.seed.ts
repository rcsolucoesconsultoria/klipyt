import { DataSource } from 'typeorm';
import { PlatformSetting } from '../../../domain/entities/platform-setting.entity';

export async function seedPlatformSettings(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(PlatformSetting);

  const seeds = [
    { setting_key: 'global_margin', setting_value: 0.40 },
    { setting_key: 'fase_monetizacao_ativa', setting_value: false },
    { setting_key: 'tema_ativo', setting_value: 'COPA' },
  ];

  for (const seed of seeds) {
    const exists = await repo.findOne({ where: { setting_key: seed.setting_key } });
    if (!exists) {
      await repo.save(repo.create(seed));
      console.log(`Seed: ${seed.setting_key} = ${JSON.stringify(seed.setting_value)}`);
    }
  }
}
