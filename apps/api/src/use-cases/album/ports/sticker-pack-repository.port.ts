import { StickerPack } from '../../../domain/entities/sticker-pack.entity';

export interface IStickerPackRepository {
  findById(id: string): Promise<StickerPack | null>;
  findActiveByEstablishment(establishmentId: string): Promise<StickerPack | null>;
}
