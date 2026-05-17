import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSticker } from '../../../domain/entities/user-sticker.entity';
import { RewardStatus } from '../../../domain/enums/reward-status.enum';
import { IUserStickerRepository } from '../../../use-cases/album/ports/user-sticker-repository.port';

@Injectable()
export class UserStickerRepository implements IUserStickerRepository {
  constructor(
    @InjectRepository(UserSticker)
    private readonly repo: Repository<UserSticker>,
  ) {}

  async findByUserAndSticker(userId: string, stickerId: string): Promise<UserSticker | null> {
    return this.repo.findOne({ where: { user_id: userId, sticker_id: stickerId } });
  }

  async findByQrToken(qrToken: string): Promise<UserSticker | null> {
    return this.repo.findOne({
      where: { qr_token: qrToken },
      relations: ['sticker'],
    });
  }

  async findByUserId(userId: string): Promise<UserSticker[]> {
    return this.repo.find({
      where: { user_id: userId },
      relations: ['sticker'],
    });
  }

  async upsert(userId: string, stickerId: string): Promise<UserSticker> {
    const existing = await this.findByUserAndSticker(userId, stickerId);
    if (existing) {
      existing.quantity += 1;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ user_id: userId, sticker_id: stickerId, quantity: 1 }));
  }

  async decrement(userId: string, stickerId: string): Promise<void> {
    const existing = await this.findByUserAndSticker(userId, stickerId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      await this.repo.delete({ id: existing.id });
    } else {
      existing.quantity -= 1;
      await this.repo.save(existing);
    }
  }

  async setQrToken(id: string, qrToken: string): Promise<void> {
    await this.repo.update(id, { qr_token: qrToken });
  }

  async markRedeemed(id: string): Promise<void> {
    await this.repo.update(id, { reward_status: RewardStatus.REDEEMED });
  }
}
