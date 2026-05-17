import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Sticker } from '../../domain/entities/sticker.entity';
import { AssetType } from '../../domain/enums/asset-type.enum';
import { Rarity } from '../../domain/enums/rarity.enum';
import { GeoValidatorService } from '../../domain/services/geo-validator.service';
import { RarityRollerService } from '../../domain/services/rarity-roller.service';
import { GeoPoint } from '../../domain/value-objects/geo-point.vo';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IUnifiedCollectionRepository } from './ports/unified-collection-repository.port';
import { IStickerPackRepository } from './ports/sticker-pack-repository.port';
import { IStickerRepository } from './ports/sticker-repository.port';
import { IUserStickerRepository } from './ports/user-sticker-repository.port';

const MAX_PACKS_PER_DAY = 2;

export interface OpenPackInput {
  userId: string;
  userCpf: string | null;
  packId: string;
  userLat: number;
  userLon: number;
}

export interface OpenPackResult {
  stickers: Array<{
    id: string;
    title: string;
    rarity: Rarity;
    image_url: string;
    has_reward: boolean;
    qr_token: string | null;
  }>;
}

@Injectable()
export class OpenPackUseCase {
  constructor(
    @Inject(TOKENS.STICKER_PACK_REPOSITORY)
    private readonly stickerPacks: IStickerPackRepository,
    @Inject(TOKENS.STICKER_REPOSITORY)
    private readonly stickers: IStickerRepository,
    @Inject(TOKENS.USER_STICKER_REPOSITORY)
    private readonly userStickers: IUserStickerRepository,
    @Inject(TOKENS.UNIFIED_COLLECTION_REPOSITORY)
    private readonly collections: IUnifiedCollectionRepository,
    private readonly geoValidator: GeoValidatorService,
    private readonly rarityRoller: RarityRollerService,
    private readonly redis: RedisService,
  ) {}

  async execute(input: OpenPackInput): Promise<OpenPackResult> {
    const pack = await this.stickerPacks.findById(input.packId);
    if (!pack || !pack.is_active) {
      throw new NotFoundException('Pacote de figurinhas não encontrado');
    }

    const packGeom = this.parseGeom(pack.geom);
    const userPoint = new GeoPoint(input.userLat, input.userLon);
    if (!this.geoValidator.isWithinRadius(userPoint, packGeom)) {
      throw new HttpException(
        'Você precisa estar a menos de 25 metros do ponto de coleta',
        HttpStatus.FORBIDDEN,
      );
    }

    const rateLimitKey = `rate:cpf:${input.userCpf ?? input.userId}:pack:${pack.establishment_id}`;
    const currentCount = await this.redis.get(rateLimitKey);
    if (currentCount && parseInt(currentCount) >= MAX_PACKS_PER_DAY) {
      throw new HttpException(
        `Limite de ${MAX_PACKS_PER_DAY} pacotes por dia neste estabelecimento atingido`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rarities = this.rarityRoller.rollPack(3);
    const drawnStickers: Array<{ sticker: Sticker; qrToken: string | null }> = [];

    for (const rarity of rarities) {
      let sticker = await this.stickers.findRandomByEstablishmentAndRarity(
        pack.establishment_id,
        rarity,
      );
      if (!sticker) {
        sticker = await this.stickers.findFallback(pack.establishment_id);
      }
      if (!sticker) continue;

      const userSticker = await this.userStickers.upsert(input.userId, sticker.id);

      let qrToken: string | null = null;
      if (
        sticker.has_reward &&
        (rarity === Rarity.RARE || rarity === Rarity.LEGENDARY) &&
        userSticker.qr_token === null
      ) {
        qrToken = uuidv4();
        await this.userStickers.setQrToken(userSticker.id, qrToken);
      } else {
        qrToken = userSticker.qr_token;
      }

      drawnStickers.push({ sticker, qrToken });
    }

    await this.collections.register(
      input.userId,
      pack.establishment_id,
      AssetType.STICKER_PACK,
    );

    const newCount = await this.redis.incrementWithExpiry(rateLimitKey, 86400);
    void newCount;

    return {
      stickers: drawnStickers.map(({ sticker, qrToken }) => ({
        id: sticker.id,
        title: sticker.title,
        rarity: sticker.rarity,
        image_url: sticker.image_url,
        has_reward: sticker.has_reward,
        qr_token: qrToken,
      })),
    };
  }

  private parseGeom(geom: string): GeoPoint {
    const match = geom.match(/POINT\(([^\s]+)\s+([^\s)]+)\)/i);
    if (match) {
      return new GeoPoint(parseFloat(match[2]), parseFloat(match[1]));
    }
    const obj = JSON.parse(geom) as any;
    if (obj?.coordinates) {
      return new GeoPoint(obj.coordinates[1], obj.coordinates[0]);
    }
    throw new Error('Formato de geometria não suportado');
  }
}
