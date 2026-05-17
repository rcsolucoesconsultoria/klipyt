import { UserSticker } from '../../../domain/entities/user-sticker.entity';

export interface IUserStickerRepository {
  findByUserAndSticker(userId: string, stickerId: string): Promise<UserSticker | null>;
  findByQrToken(qrToken: string): Promise<UserSticker | null>;
  upsert(userId: string, stickerId: string): Promise<UserSticker>;
  decrement(userId: string, stickerId: string): Promise<void>;
  setQrToken(id: string, qrToken: string): Promise<void>;
  markRedeemed(id: string): Promise<void>;
  findByUserId(userId: string): Promise<UserSticker[]>;
}
