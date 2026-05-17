import { DataSource } from 'typeorm';
import { Sticker } from '../../../domain/entities/sticker.entity';
import { Establishment } from '../../../domain/entities/establishment.entity';
import { Rarity } from '../../../domain/enums/rarity.enum';

const PLAYERS = [
  { title: 'Vini Jr. #7', rarity: Rarity.LEGENDARY, has_reward: true, reward_description: 'Brinde exclusivo + 15% off', reward_code: 'VINI15' },
  { title: 'Neymar #10', rarity: Rarity.LEGENDARY, has_reward: true, reward_description: '15% de desconto em compras', reward_code: 'NEY15' },
  { title: 'Richarlison #9', rarity: Rarity.RARE, has_reward: true, reward_description: 'Ganhe um brinde especial', reward_code: 'RICH10' },
  { title: 'Rodrygo #11', rarity: Rarity.RARE, has_reward: false },
  { title: 'Casemiro #5', rarity: Rarity.RARE, has_reward: false },
  { title: 'Alisson #1', rarity: Rarity.COMMON, has_reward: false },
  { title: 'Marquinhos #4', rarity: Rarity.COMMON, has_reward: false },
  { title: 'Militão #3', rarity: Rarity.COMMON, has_reward: false },
  { title: 'Paquetá #8', rarity: Rarity.COMMON, has_reward: false },
  { title: 'Raphinha #17', rarity: Rarity.COMMON, has_reward: false },
];

export async function seedStickers(dataSource: DataSource): Promise<void> {
  const stickerRepo = dataSource.getRepository(Sticker);
  const estRepo = dataSource.getRepository(Establishment);

  const establishments = await estRepo.find({ take: 3 });
  if (establishments.length === 0) return;

  let stickerNum = 1;

  for (const est of establishments) {
    for (const player of PLAYERS) {
      const num = stickerNum++;
      const existing = await stickerRepo.findOne({ where: { sticker_number: num } });
      if (existing) continue;

      await stickerRepo.save(
        stickerRepo.create({
          establishment_id: est.id,
          sticker_number: num,
          title: player.title,
          page_number: Math.ceil(num / 10),
          rarity: player.rarity,
          image_url: `https://picsum.photos/seed/${num}/200/280`,
          has_reward: player.has_reward,
          reward_description: player.has_reward ? (player as any).reward_description : null,
          reward_code: player.has_reward ? (player as any).reward_code : null,
        }),
      );
    }
    console.log(`Seed figurinhas para: ${est.trade_name}`);
  }
}
