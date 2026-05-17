import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketplaceStatus } from '../../domain/enums/marketplace-status.enum';
import { TOKENS } from '../tokens';
import { IMarketplaceOrderRepository } from './ports/marketplace-order-repository.port';
import { MarketplacePaymentService } from './marketplace-payment.service';

export type MarketplacePaymentMethod = 'wallet' | 'pix';

export interface PurchaseOrderInput {
  buyerId: string;
  orderId: string;
  paymentMethod?: MarketplacePaymentMethod;
}

@Injectable()
export class PurchaseMarketplaceOrderUseCase {
  constructor(
    @Inject(TOKENS.MARKETPLACE_ORDER_REPOSITORY)
    private readonly orders: IMarketplaceOrderRepository,
    private readonly payments: MarketplacePaymentService,
  ) {}

  async execute(input: PurchaseOrderInput) {
    const order = await this.orders.findById(input.orderId);
    if (!order) throw new NotFoundException('Anúncio não encontrado');
    if (order.status !== MarketplaceStatus.LISTED) {
      throw new ConflictException('Anúncio não está disponível');
    }
    if (order.seller_id === input.buyerId) {
      throw new BadRequestException('Não é possível comprar sua própria moeda');
    }

    const listPrice = Number(order.list_price);
    const sellerNet = Number(order.seller_net);
    const platformFee = Number(order.platform_fee);
    const method = input.paymentMethod ?? 'wallet';

    if (method === 'pix') {
      return this.payments.initPixCharge(
        order.id,
        input.buyerId,
        listPrice,
        sellerNet,
        platformFee,
        order.seller_id,
        order.coin_id,
      );
    }

    try {
      return await this.payments.completeWalletPurchase(
        order.id,
        input.buyerId,
        listPrice,
        sellerNet,
        order.seller_id,
        order.coin_id,
        platformFee,
      );
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT_BALANCE') {
        throw new HttpException(
          {
            message: 'Saldo insuficiente na carteira KLIPYT',
            shortfall: err.shortfall,
            wallet_balance: err.wallet_balance,
            list_price: listPrice,
            can_pay_with_pix: true,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      throw err;
    }
  }
}
