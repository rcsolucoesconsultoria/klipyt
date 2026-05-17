import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PinCode } from '../../domain/value-objects/pin-code.vo';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IUserStickerRepository } from './ports/user-sticker-repository.port';

const PIN_TTL_SECONDS = 120;

export interface GeneratePinInput {
  userId: string;
  stickerId: string;
  userLat: number;
  userLon: number;
}

export interface GeneratePinResult {
  pin: string;
  expires_in_seconds: number;
}

@Injectable()
export class GenerateTradePinUseCase {
  constructor(
    @Inject(TOKENS.USER_STICKER_REPOSITORY)
    private readonly userStickers: IUserStickerRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(input: GeneratePinInput): Promise<GeneratePinResult> {
    const userSticker = await this.userStickers.findByUserAndSticker(
      input.userId,
      input.stickerId,
    );
    if (!userSticker || userSticker.quantity < 2) {
      throw new BadRequestException(
        'Você precisa de ao menos 2 cópias desta figurinha para trocar',
      );
    }

    const pin = PinCode.generate();
    const key = `trade:pin:${pin.toString()}`;

    await this.redis.hset(key, {
      sender_id: input.userId,
      sticker_id: input.stickerId,
      lat: input.userLat,
      lon: input.userLon,
    });
    await this.redis.expire(key, PIN_TTL_SECONDS);

    return { pin: pin.toString(), expires_in_seconds: PIN_TTL_SECONDS };
  }
}
