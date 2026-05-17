import { Inject, Injectable } from '@nestjs/common';
import { TOKENS } from '../tokens';
import { IFinancialCoinRepository } from '../campaign/ports/financial-coin-repository.port';

@Injectable()
export class GetMyMarketplaceCoinsUseCase {
  constructor(
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY)
    private readonly coins: IFinancialCoinRepository,
  ) {}

  async execute(userId: string) {
    const coins = await this.coins.findOwnedTradeable(userId);
    return coins.map((c) => ({
      coin_id: c.id,
      value: c.value,
      is_qualified: c.is_qualified,
      coin_type: c.is_qualified ? 'GOLD' : 'BRONZE',
    }));
  }
}
