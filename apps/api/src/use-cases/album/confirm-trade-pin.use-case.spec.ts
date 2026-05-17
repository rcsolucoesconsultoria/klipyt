import { ConfirmTradePinUseCase } from './confirm-trade-pin.use-case';
import { GeoValidatorService } from '../../domain/services/geo-validator.service';
import { HttpStatus } from '@nestjs/common';

const mockUserStickerRepo = {
  upsert: jest.fn(),
  decrement: jest.fn(),
  findByUserAndSticker: jest.fn(),
  findByQrToken: jest.fn(),
  setQrToken: jest.fn(),
  markRedeemed: jest.fn(),
  findByUserId: jest.fn(),
};

const mockRedis = {
  hgetall: jest.fn(),
  del: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  hset: jest.fn(),
  expire: jest.fn(),
  exists: jest.fn(),
  incrementWithExpiry: jest.fn(),
};

describe('ConfirmTradePinUseCase (UC10)', () => {
  let useCase: ConfirmTradePinUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ConfirmTradePinUseCase(
      mockUserStickerRepo as any,
      mockRedis as any,
      new GeoValidatorService(),
    );
  });

  it('troca figurinhas quando PIN válido e usuários próximos', async () => {
    mockRedis.hgetall.mockResolvedValue({
      sender_id: 'user-a',
      sticker_id: 'sticker-1',
      lat: '-23.5505',
      lon: '-46.6333',
    });
    mockUserStickerRepo.decrement.mockResolvedValue(undefined);
    mockUserStickerRepo.upsert.mockResolvedValue({ id: 'us-new' });
    mockRedis.del.mockResolvedValue(undefined);

    const result = await useCase.execute({
      receiverUserId: 'user-b',
      pin: '8530',
      receiverLat: -23.5504,
      receiverLon: -46.6333,
    });

    expect(mockRedis.del).toHaveBeenCalledWith('trade:pin:8530');
    expect(mockUserStickerRepo.decrement).toHaveBeenCalledWith('user-a', 'sticker-1');
    expect(mockUserStickerRepo.upsert).toHaveBeenCalledWith('user-b', 'sticker-1');
    expect(result.sticker_id).toBe('sticker-1');
  });

  it('retorna HTTP 410 quando PIN expirado', async () => {
    mockRedis.hgetall.mockResolvedValue({});

    await expect(
      useCase.execute({
        receiverUserId: 'user-b',
        pin: '0000',
        receiverLat: -23.5505,
        receiverLon: -46.6333,
      }),
    ).rejects.toThrow(expect.objectContaining({ status: HttpStatus.GONE }));
  });

  it('retorna HTTP 403 quando usuários estão a mais de 25m', async () => {
    mockRedis.hgetall.mockResolvedValue({
      sender_id: 'user-a',
      sticker_id: 'sticker-1',
      lat: '-23.5505',
      lon: '-46.6333',
    });

    await expect(
      useCase.execute({
        receiverUserId: 'user-b',
        pin: '8530',
        receiverLat: -23.5532,
        receiverLon: -46.6333,
      }),
    ).rejects.toThrow(expect.objectContaining({ status: HttpStatus.FORBIDDEN }));
  });
});
