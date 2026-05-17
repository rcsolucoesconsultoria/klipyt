import { Body, Controller, Get, Inject, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { OpenPackUseCase } from '../../../use-cases/album/open-pack.use-case';
import { GenerateTradePinUseCase } from '../../../use-cases/album/generate-trade-pin.use-case';
import { ConfirmTradePinUseCase } from '../../../use-cases/album/confirm-trade-pin.use-case';
import { OpenPackDto, GeneratePinDto, ConfirmPinDto } from '../dto/album.dto';
import { TOKENS } from '../../../use-cases/tokens';
import { IUserStickerRepository } from '../../../use-cases/album/ports/user-sticker-repository.port';
import { RedisService } from '../../redis/redis.service';

@Controller('album')
@UseGuards(JwtAuthGuard)
export class AlbumController {
  constructor(
    private readonly openPack: OpenPackUseCase,
    private readonly generatePin: GenerateTradePinUseCase,
    private readonly confirmPin: ConfirmTradePinUseCase,
    @Inject(TOKENS.USER_STICKER_REPOSITORY)
    private readonly userStickers: IUserStickerRepository,
    private readonly redis: RedisService,
  ) {}

  @Post('open-pack')
  openPackHandler(
    @CurrentUser() user: { id: string; cpf?: string },
    @Body() dto: OpenPackDto,
  ) {
    return this.openPack.execute({
      userId: user.id,
      userCpf: user.cpf ?? null,
      packId: dto.pack_id,
      userLat: dto.lat,
      userLon: dto.lon,
    });
  }

  @Get('my-stickers')
  async myStickers(@CurrentUser() user: { id: string }) {
    return this.userStickers.findByUserId(user.id);
  }

  @Get('packs/nearby')
  async nearbyPacks(@Query('lat') lat: string, @Query('lon') lon: string) {
    const packIds = await this.redis.geosearch('active_packs:geo', parseFloat(lon), parseFloat(lat), 5);
    const packs: Array<{ id: string; lat: number; lon: number }> = [];
    for (const id of packIds) {
      const pos = await this.redis.geopos('active_packs:geo', id);
      if (pos) packs.push({ id, lat: pos[1], lon: pos[0] });
    }
    return { packs };
  }

  @Post('trade/generate-pin')
  generatePinHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: GeneratePinDto,
  ) {
    return this.generatePin.execute({
      userId: user.id,
      stickerId: dto.sticker_id,
      userLat: dto.lat,
      userLon: dto.lon,
    });
  }

  @Post('trade/confirm-pin')
  confirmPinHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: ConfirmPinDto,
  ) {
    return this.confirmPin.execute({
      receiverUserId: user.id,
      pin: dto.pin,
      receiverLat: dto.lat,
      receiverLon: dto.lon,
    });
  }
}
