import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RedeemStickerCouponUseCase } from '../../../use-cases/sticker/redeem-sticker-coupon.use-case';
import { RedeemCouponDto } from '../dto/sticker.dto';

@Controller('stickers')
@UseGuards(JwtAuthGuard)
export class StickerController {
  constructor(private readonly redeem: RedeemStickerCouponUseCase) {}

  @Post('redeem')
  redeemHandler(@Body() dto: RedeemCouponDto) {
    return this.redeem.execute({
      qr_token: dto.qr_token,
      establishment_id: dto.establishment_id,
    });
  }
}
