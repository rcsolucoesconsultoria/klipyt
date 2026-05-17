import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
  ) {}

  // RF07: Frontend envia token após assistir vídeo completo
  @Post('video-watched')
  async videoWatched(
    @CurrentUser() user: { id: string },
    @Body() dto: VideoWatchedDto,
  ) {
    const key = `video:token:${user.id}:${dto.coin_id}`;
    await this.redis.set(key, '1', 300);
    return { ok: true };
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
