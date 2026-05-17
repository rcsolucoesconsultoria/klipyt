import { Inject, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GeoValidatorService } from '../../domain/services/geo-validator.service';
import { GeoPoint } from '../../domain/value-objects/geo-point.vo';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IUserStickerRepository } from './ports/user-sticker-repository.port';

export interface ConfirmPinInput {
  receiverUserId: string;
  pin: string;
  receiverLat: number;
  receiverLon: number;
}

export interface ConfirmPinResult {
  sticker_id: string;
  message: string;
}

@Injectable()
export class ConfirmTradePinUseCase {
  constructor(
    @Inject(TOKENS.USER_STICKER_REPOSITORY)
    private readonly userStickers: IUserStickerRepository,
    private readonly redis: RedisService,
    private readonly geoValidator: GeoValidatorService,
  ) {}

  async execute(input: ConfirmPinInput): Promise<ConfirmPinResult> {
    const key = `trade:pin:${input.pin}`;
    const data = await this.redis.hgetall(key);

    if (!data || !data.sender_id) {
      throw new HttpException(
        'Código de troca expirado ou inválido',
        HttpStatus.GONE,
      );
    }

    const senderPoint = new GeoPoint(parseFloat(data.lat), parseFloat(data.lon));
    const receiverPoint = new GeoPoint(input.receiverLat, input.receiverLon);

    if (!this.geoValidator.isWithinRadius(senderPoint, receiverPoint)) {
      throw new HttpException(
        'Vocês precisam estar a menos de 25 metros um do outro para trocar',
        HttpStatus.FORBIDDEN,
      );
    }

    const stickerId = data.sticker_id;
    const senderId = data.sender_id;

    await this.redis.del(key);

    await this.userStickers.decrement(senderId, stickerId);
    await this.userStickers.upsert(input.receiverUserId, stickerId);

    return {
      sticker_id: stickerId,
      message: 'Troca realizada com sucesso!',
    };
  }
}
