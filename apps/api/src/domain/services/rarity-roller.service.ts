import { Rarity } from '../enums/rarity.enum';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  [Rarity.COMMON]: 70,
  [Rarity.RARE]: 25,
  [Rarity.LEGENDARY]: 5,
};

export class RarityRollerService {
  roll(): Rarity {
    const roll = Math.random() * 100;
    if (roll < RARITY_WEIGHTS[Rarity.COMMON]) return Rarity.COMMON;
    if (roll < RARITY_WEIGHTS[Rarity.COMMON] + RARITY_WEIGHTS[Rarity.RARE]) return Rarity.RARE;
    return Rarity.LEGENDARY;
  }

  rollPack(count: number): Rarity[] {
    return Array.from({ length: count }, () => this.roll());
  }
}
