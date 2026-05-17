import * as crypto from 'crypto';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { CollectCoinUseCase } from '../../../use-cases/collect/collect-coin.use-case';
import { CollectCoinDto, VideoWatchedDto } from '../dto/collect.dto';
import { RedisService } from '../../redis/redis.service';

@Controller('campaigns')
@UseGuards(JwtAuthGuard)
export class CollectController {
  constructor(
    private readonly collectCoin: CollectCoinUseCase,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  /**
   * RF07 — Frontend chama após assistir o vídeo até o final (onEnded).
   * Armazena o token no Redis e retorna um collect_token assinado,
   * para que o cliente não precise conhecer o JWT_SECRET para gerar HMAC.
   */
  @Post('video-watched')
  async videoWatched(
    @CurrentUser() user: { id: string },
    @Body() dto: VideoWatchedDto,
  ) {
    const key = `video:token:${user.id}:${dto.coin_id}`;
    await this.redis.set(key, '1', 300);

    const timestampMs = Date.now();
    const secret = this.config.get<string>('JWT_SECRET', 'changeme_in_production');
    const collectToken = crypto
      .createHmac('sha256', secret)
      .update(`${user.id}:${dto.coin_id}:${timestampMs}`)
      .digest('hex');

    return { collect_token: collectToken, timestamp_ms: timestampMs };
  }

  @Post('collect')
  collectHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: CollectCoinDto,
  ) {
    return this.collectCoin.execute({
      userId: user.id,
      coinId: dto.coin_id,
      lat: dto.lat,
      lon: dto.lon,
      timestampMs: dto.timestamp_ms,
      hmacSignature: dto.hmac,
      videoTokenPresented: true,
    });
  }
}
