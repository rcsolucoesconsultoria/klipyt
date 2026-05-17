import { ConflictException, NotFoundException } from '@nestjs/common';
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
      sticker: { title: 'Neymar #10' },
    });
    mockUserStickerRepo.markRedeemed.mockResolvedValue(undefined);

    const result = await useCase.execute({ qr_token: 'valid-token' });

    expect(mockUserStickerRepo.markRedeemed).toHaveBeenCalledWith('us-1');
    expect(result.discount_percent).toBe(15);
  });

  it('retorna HTTP 409 em tentativa de reusar cupom já queimado', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue({
      id: 'us-1',
      reward_status: RewardStatus.REDEEMED,
      sticker: { title: 'Neymar #10' },
    });

    await expect(useCase.execute({ qr_token: 'used-token' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('retorna HTTP 404 para token inexistente', async () => {
    mockUserStickerRepo.findByQrToken.mockResolvedValue(null);

    await expect(useCase.execute({ qr_token: 'fake' })).rejects.toThrow(NotFoundException);
  });
});
