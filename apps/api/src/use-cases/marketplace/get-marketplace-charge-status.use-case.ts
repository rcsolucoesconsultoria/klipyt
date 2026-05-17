import { Injectable, NotFoundException } from '@nestjs/common';
import { MarketplacePaymentService } from './marketplace-payment.service';

@Injectable()
export class GetMarketplaceChargeStatusUseCase {
  constructor(private readonly payments: MarketplacePaymentService) {}

  async execute(chargeId: string) {
    const charge = await this.payments.getCharge(chargeId);
    if (!charge) throw new NotFoundException('Cobrança não encontrada');

    return {
      charge_id: chargeId,
      status: charge.status,
      order_id: charge.orderId,
      amount: charge.amount,
    };
  }
}
