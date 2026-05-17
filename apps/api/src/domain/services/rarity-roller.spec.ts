import { RarityRollerService } from './rarity-roller.service';
import { Rarity } from '../enums/rarity.enum';

describe('RarityRollerService', () => {
  const service = new RarityRollerService();

  it('deve sortear distribuição 70/25/5 em 10000 amostras (RF11)', () => {
    const counts: Record<Rarity, number> = {
      [Rarity.COMMON]: 0,
      [Rarity.RARE]: 0,
      [Rarity.LEGENDARY]: 0,
    };
    const N = 10000;
    for (let i = 0; i < N; i++) counts[service.roll()]++;

    const commonPct = (counts[Rarity.COMMON] / N) * 100;
    const rarePct = (counts[Rarity.RARE] / N) * 100;
    const legendaryPct = (counts[Rarity.LEGENDARY] / N) * 100;

    expect(commonPct).toBeGreaterThan(65);
    expect(commonPct).toBeLessThan(75);
    expect(rarePct).toBeGreaterThan(20);
    expect(rarePct).toBeLessThan(30);
    expect(legendaryPct).toBeGreaterThan(2);
    expect(legendaryPct).toBeLessThan(8);
  });

  it('rollPack retorna exatamente 3 cards', () => {
    const pack = service.rollPack(3);
    expect(pack).toHaveLength(3);
  });
});
