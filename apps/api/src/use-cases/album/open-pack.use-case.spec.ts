import { OpenPackUseCase } from './open-pack.use-case';
import { Rarity } from '../../domain/enums/rarity.enum';
import { GeoValidatorService } from '../../domain/services/geo-validator.service';
import { RarityRollerService } from '../../domain/services/rarity-roller.service';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

const ESTABLISHMENT_ID = 'est-uuid-1';
const PACK_GEOM = 'POINT(-46.6333 -23.5505)';

const mockPack = {
  id: 'pack-uuid-1',
  establishment_id: ESTABLISHMENT_ID,
  is_active: true,
  geom: PACK_GEOM,
};

const mockSticker = {
  id: 'sticker-uuid-1',
  title: 'Vini Jr. #7',
  rarity: Rarity.LEGENDARY,
  image_url: 'https://example.com/img.png',
  has_reward: true,
};

const mockPackRepo = { findById: jest.fn(), findActiveByEstablishment: jest.fn() };
const mockStickerRepo = { findRandomByEstablishmentAndRarity: jest.fn(), findFallback: jest.fn() };
const mockUserStickerRepo = {
  findByUserAndSticker: jest.fn(),
  upsert: jest.fn(),
  setQrToken: jest.fn(),
  decrement: jest.fn(),
  findByUserId: jest.fn(),
  markRedeemed: jest.fn(),
  findByQrToken: jest.fn(),
};
const mockCollections = { countToday: jest.fn(), register: jest.fn() };
const mockRedis = {
  get: jest.fn(),
  incrementWithExpiry: jest.fn(),
  hset: jest.fn(),
  hgetall: jest.fn(),
  expire: jest.fn(),
  del: jest.fn(),
  geoadd: jest.fn(),
  geosearch: jest.fn(),
};

describe('OpenPackUseCase (UC08)', () => {
  let useCase: OpenPackUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new OpenPackUseCase(
      mockPackRepo as any,
      mockStickerRepo as any,
      mockUserStickerRepo as any,
      mockCollections as any,
      new GeoValidatorService(),
      new RarityRollerService(),
      mockRedis as any,
    );
  });

  it('sorteia 3 figurinhas com pesos corretos e registra coleta (RF11, RN03)', async () => {
    mockPackRepo.findById.mockResolvedValue(mockPack);
    mockRedis.get.mockResolvedValue(null);
    mockStickerRepo.findRandomByEstablishmentAndRarity.mockResolvedValue(mockSticker);
    mockUserStickerRepo.upsert.mockResolvedValue({ id: 'us-1', quantity: 1, qr_token: null });
    mockUserStickerRepo.setQrToken.mockResolvedValue(undefined);
    mockCollections.register.mockResolvedValue({});
    mockRedis.incrementWithExpiry.mockResolvedValue(1);

    const result = await useCase.execute({
      userId: 'user-1',
      userCpf: '12345678901',
      packId: 'pack-uuid-1',
      userLat: -23.5505,
      userLon: -46.6333,
    });

    expect(result.stickers).toHaveLength(3);
    expect(mockCollections.register).toHaveBeenCalledTimes(1);
  });

  it('rejeita com HTTP 429 quando limite de 2 pacotes/dia atingido (RN03)', async () => {
    mockPackRepo.findById.mockResolvedValue(mockPack);
    mockRedis.get.mockResolvedValue('2');

    await expect(
      useCase.execute({
        userId: 'user-1',
        userCpf: '12345678901',
        packId: 'pack-uuid-1',
        userLat: -23.5505,
        userLon: -46.6333,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ status: HttpStatus.TOO_MANY_REQUESTS }),
    );
  });

  it('rejeita com HTTP 403 quando usuário está fora do raio de 25m', async () => {
    mockPackRepo.findById.mockResolvedValue(mockPack);
    mockRedis.get.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        userCpf: '12345678901',
        packId: 'pack-uuid-1',
        userLat: -23.5532,
        userLon: -46.6333,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ status: HttpStatus.FORBIDDEN }),
    );
  });
});
