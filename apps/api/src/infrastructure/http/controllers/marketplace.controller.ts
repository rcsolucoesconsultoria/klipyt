import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { ListMarketplaceUseCase } from '../../../use-cases/marketplace/list-marketplace.use-case';
import { CreateMarketplaceListingUseCase } from '../../../use-cases/marketplace/create-marketplace-listing.use-case';
import { PurchaseMarketplaceOrderUseCase } from '../../../use-cases/marketplace/purchase-marketplace-order.use-case';
import { GetMarketplaceChargeStatusUseCase } from '../../../use-cases/marketplace/get-marketplace-charge-status.use-case';
import { ConfirmMarketplaceChargeUseCase } from '../../../use-cases/marketplace/confirm-marketplace-charge.use-case';
import { GetMyMarketplaceCoinsUseCase } from '../../../use-cases/marketplace/get-my-marketplace-coins.use-case';
import { BuyOrderDto, CreateListingDto } from '../dto/marketplace.dto';

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(
    private readonly listMarketplace: ListMarketplaceUseCase,
    private readonly createListing: CreateMarketplaceListingUseCase,
    private readonly purchaseOrder: PurchaseMarketplaceOrderUseCase,
    private readonly chargeStatus: GetMarketplaceChargeStatusUseCase,
    private readonly confirmCharge: ConfirmMarketplaceChargeUseCase,
    private readonly myCoins: GetMyMarketplaceCoinsUseCase,
    private readonly config: ConfigService,
  ) {}

  @Get()
  listHandler() {
    return this.listMarketplace.execute();
  }

  @Post('list')
  createListingHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateListingDto,
  ) {
    return this.createListing.execute({
      sellerId: user.id,
      coinId: dto.coin_id,
      listPrice: dto.list_price,
    });
  }

  @Get('my-coins')
  myCoinsHandler(@CurrentUser() user: { id: string }) {
    return this.myCoins.execute(user.id);
  }

  @Get('charges/:chargeId')
  chargeStatusHandler(@Param('chargeId') chargeId: string) {
    return this.chargeStatus.execute(chargeId);
  }

  @Post('charges/:chargeId/confirm')
  confirmChargeHandler(
    @CurrentUser() user: { id: string },
    @Param('chargeId') chargeId: string,
  ) {
    return this.confirmCharge.execute(chargeId, user.id);
  }

  /** Somente mock/dev — simula liquidação Pix da cobrança */
  @Post('charges/:chargeId/simulate')
  simulateChargeHandler(
    @CurrentUser() user: { id: string },
    @Param('chargeId') chargeId: string,
  ) {
    if (this.config.get('PIX_GATEWAY', 'mock') !== 'mock') {
      return { error: 'Disponível apenas com PIX_GATEWAY=mock' };
    }
    return this.confirmCharge.execute(chargeId, user.id);
  }

  @Post(':id/buy')
  buyHandler(
    @CurrentUser() user: { id: string },
    @Param('id') orderId: string,
    @Body() dto: BuyOrderDto,
  ) {
    return this.purchaseOrder.execute({
      buyerId: user.id,
      orderId,
      paymentMethod: dto.payment_method,
    });
  }
}
