import { Rarity } from '../../../domain/enums/rarity.enum';
import { Sticker } from '../../../domain/entities/sticker.entity';

export interface IStickerRepository {
  findRandomByEstablishmentAndRarity(
    establishmentId: string,
    rarity: Rarity,
  ): Promise<Sticker | null>;
  findFallback(establishmentId: string): Promise<Sticker | null>;
}
