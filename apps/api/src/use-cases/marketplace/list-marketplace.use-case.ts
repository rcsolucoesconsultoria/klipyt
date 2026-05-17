import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../tokens';
import { IMarketplaceOrderRepository } from './ports/marketplace-order-repository.port';

@Injectable()
export class ListMarketplaceUseCase {
  constructor(
    @Inject(TOKENS.MARKETPLACE_ORDER_REPOSITORY)
    private readonly orders: IMarketplaceOrderRepository,
  ) {}

  async execute() {
    const listed = await this.orders.findListed();
    return listed.map((o) => ({
      id: o.id,
      coin_id: o.coin_id,
      list_price: Number(o.list_price),
      platform_fee: Number(o.platform_fee),
      seller_net: Number(o.seller_net),
      coin_value: o.coin ? Number(o.coin.value) : null,
      coin_type: o.coin?.is_qualified ? 'GOLD' : 'BRONZE',
      created_at: o.created_at,
    }));
  }
}
