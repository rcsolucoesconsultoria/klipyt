import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { OpenPackUseCase } from '../../../use-cases/album/open-pack.use-case';
import { GenerateTradePinUseCase } from '../../../use-cases/album/generate-trade-pin.use-case';
import { ConfirmTradePinUseCase } from '../../../use-cases/album/confirm-trade-pin.use-case';
import { OpenPackDto, GeneratePinDto, ConfirmPinDto } from '../dto/album.dto';

@Controller('album')
@UseGuards(JwtAuthGuard)
export class AlbumController {
  constructor(
    private readonly openPack: OpenPackUseCase,
    private readonly generatePin: GenerateTradePinUseCase,
    private readonly confirmPin: ConfirmTradePinUseCase,
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
