import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MarketplaceStatus } from '../../domain/enums/marketplace-status.enum';
import { TOKENS } from '../tokens';
import { IFinancialCoinRepository } from '../campaign/ports/financial-coin-repository.port';
import { IMarketplaceOrderRepository } from './ports/marketplace-order-repository.port';

const PLATFORM_FEE_RATE = 0.1;

export interface CreateListingInput {
  sellerId: string;
  coinId: string;
  listPrice: number;
}

@Injectable()
export class CreateMarketplaceListingUseCase {
  constructor(
    @Inject(TOKENS.MARKETPLACE_ORDER_REPOSITORY)
    private readonly orders: IMarketplaceOrderRepository,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY)
    private readonly coins: IFinancialCoinRepository,
  ) {}

  async execute(input: CreateListingInput) {
    if (input.listPrice <= 0) {
      throw new BadRequestException('Preço de listagem deve ser positivo');
    }

    const coin = await this.coins.findRawById(input.coinId);
    if (!coin) throw new NotFoundException('Moeda não encontrada');
    if (!coin.owner_user_id || coin.owner_user_id !== input.sellerId) {
      throw new ForbiddenException('Você não é o proprietário desta moeda');
    }

    const existing = await this.orders.findActiveByCoinId(input.coinId);
    if (existing) {
      throw new ConflictException('Moeda já está listada no marketplace');
    }

    const platformFee = Math.round(input.listPrice * PLATFORM_FEE_RATE * 100) / 100;
    const sellerNet = Math.round((input.listPrice - platformFee) * 100) / 100;

    const order = await this.orders.save({
      seller_id: input.sellerId,
      coin_id: input.coinId,
      list_price: input.listPrice,
      platform_fee: platformFee,
      seller_net: sellerNet,
      status: MarketplaceStatus.LISTED,
    });

    return {
      order_id: order.id,
      list_price: input.listPrice,
      platform_fee: platformFee,
      seller_net: sellerNet,
    };
  }
}
