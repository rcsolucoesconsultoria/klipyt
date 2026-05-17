import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RedeemStickerCouponUseCase } from './redeem-sticker-coupon.use-case';
import { RewardStatus } from '../../domain/enums/reward-status.enum';

const mockUserStickerRepo = {
  findByQrToken: jest.fn(),
  markRedeemed: jest.fn(),
  upsert: jest.fn(),
  decrement: jest.fn(),
  findByUserAndSticker: jest.fn(),
  setQrToken: jest.fn(),
  findByUserId: jest.fn(),
};

describe('RedeemStickerCouponUseCase (UC09)', () => {
  let useCase: RedeemStickerCouponUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new RedeemStickerCouponUseCase(mockUserStickerRepo as any);
  });

  it('valida cupom e marca como REDEEMED com desconto de 15% (RF12)', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue({
      id: 'us-1',
      reward_status: RewardStatus.NOT_REDEEMED,
      sticker: { title: 'Neymar #10', establishment_id: 'est-1' },
    });
    mockUserStickerRepo.markRedeemed.mockResolvedValue(undefined);

    const result = await useCase.execute({
      qr_token: 'valid-token',
      establishment_id: 'est-1',
    });

    expect(mockUserStickerRepo.markRedeemed).toHaveBeenCalledWith('us-1');
    expect(result.discount_percent).toBe(15);
  });

  it('retorna HTTP 409 em tentativa de reusar cupom já queimado', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue({
      id: 'us-1',
      reward_status: RewardStatus.REDEEMED,
      sticker: { title: 'Neymar #10' },
    });

    await expect(
      useCase.execute({ qr_token: 'used-token', establishment_id: 'est-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('retorna HTTP 404 para token inexistente', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue(null);

    await expect(
      useCase.execute({ qr_token: 'fake', establishment_id: 'est-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejeita cupom em estabelecimento divergente (UC06)', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue({
      id: 'us-1',
      reward_status: RewardStatus.NOT_REDEEMED,
      sticker: { title: 'Neymar #10', establishment_id: 'est-1' },
    });

    await expect(
      useCase.execute({ qr_token: 'valid-token', establishment_id: 'est-outro' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
