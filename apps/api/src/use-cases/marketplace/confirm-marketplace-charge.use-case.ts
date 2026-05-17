import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketplacePaymentService } from './marketplace-payment.service';

@Injectable()
export class ConfirmMarketplaceChargeUseCase {
  constructor(private readonly payments: MarketplacePaymentService) {}

  async execute(chargeId: string, buyerId: string) {
    const charge = await this.payments.getCharge(chargeId);
    if (!charge) throw new NotFoundException('Cobrança não encontrada');
    if (charge.buyerId !== buyerId) {
      throw new BadRequestException('Cobrança pertence a outro usuário');
    }
    if (charge.status === 'COMPLETED') {
      return { status: 'COMPLETED', order_id: charge.orderId };
    }

    return this.payments.completePurchase(chargeId, charge);
  }
}
