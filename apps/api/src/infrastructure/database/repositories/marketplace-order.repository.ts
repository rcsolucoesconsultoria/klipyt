import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceOrder } from '../../../domain/entities/marketplace-order.entity';
import { MarketplaceStatus } from '../../../domain/enums/marketplace-status.enum';
import { IMarketplaceOrderRepository } from '../../../use-cases/marketplace/ports/marketplace-order-repository.port';

@Injectable()
export class MarketplaceOrderRepository implements IMarketplaceOrderRepository {
  constructor(
    @InjectRepository(MarketplaceOrder)
    private readonly repo: Repository<MarketplaceOrder>,
  ) {}

  save(order: Partial<MarketplaceOrder>): Promise<MarketplaceOrder> {
    return this.repo.save(this.repo.create(order));
  }

  findById(id: string): Promise<MarketplaceOrder | null> {
    return this.repo.findOne({ where: { id }, relations: ['coin'] });
  }

  findListed(): Promise<MarketplaceOrder[]> {
    return this.repo.find({
      where: { status: MarketplaceStatus.LISTED },
      relations: ['coin', 'seller'],
      order: { created_at: 'DESC' },
    });
  }

  findActiveByCoinId(coinId: string): Promise<MarketplaceOrder | null> {
    return this.repo.findOne({
      where: { coin_id: coinId, status: MarketplaceStatus.LISTED },
    });
  }

  async updateStatus(id: string, status: MarketplaceStatus, buyerId?: string): Promise<void> {
    await this.repo.update(id, {
      status,
      buyer_id: buyerId ?? null,
      completed_at: status === MarketplaceStatus.COMPLETED ? new Date() : null,
    });
  }
}
