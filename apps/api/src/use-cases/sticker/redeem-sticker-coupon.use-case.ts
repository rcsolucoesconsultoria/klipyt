import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RewardStatus } from '../../domain/enums/reward-status.enum';
import { TOKENS } from '../tokens';
import { IUserStickerRepository } from '../album/ports/user-sticker-repository.port';

export interface RedeemCouponInput {
  qr_token: string;
}

export interface RedeemCouponResult {
  message: string;
  sticker_title: string;
  discount_percent: number;
}

@Injectable()
export class RedeemStickerCouponUseCase {
  constructor(
    @Inject(TOKENS.USER_STICKER_REPOSITORY)
    private readonly userStickers: IUserStickerRepository,
  ) {}

  async execute(input: RedeemCouponInput): Promise<RedeemCouponResult> {
    const userSticker = await this.userStickers.findByQrToken(input.qr_token);

    if (!userSticker) {
      throw new NotFoundException('Cupom não encontrado');
    }

    if (userSticker.reward_status === RewardStatus.REDEEMED) {
      throw new ConflictException('Cupom já utilizado neste estabelecimento');
    }

    await this.userStickers.markRedeemed(userSticker.id);

    return {
      message: 'Cupom validado! Autorizado a conceder o desconto.',
      sticker_title: (userSticker as any).sticker?.title ?? 'Figurinha',
      discount_percent: 15,
    };
  }
}
