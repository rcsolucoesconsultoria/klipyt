import { MarketplaceOrder } from '../../../domain/entities/marketplace-order.entity';
import { MarketplaceStatus } from '../../../domain/enums/marketplace-status.enum';

export interface IMarketplaceOrderRepository {
  save(order: Partial<MarketplaceOrder>): Promise<MarketplaceOrder>;
  findById(id: string): Promise<MarketplaceOrder | null>;
  findListed(): Promise<MarketplaceOrder[]>;
  findActiveByCoinId(coinId: string): Promise<MarketplaceOrder | null>;
  updateStatus(id: string, status: MarketplaceStatus, buyerId?: string): Promise<void>;
}
