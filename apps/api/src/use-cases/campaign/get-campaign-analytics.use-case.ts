import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '../../domain/enums/campaign-status.enum';
import { TOKENS } from '../tokens';
import { ICampaignRepository } from './ports/campaign-repository.port';
import { IFinancialCoinRepository } from './ports/financial-coin-repository.port';
import { IMerchantWalletRepository } from './ports/merchant-wallet-repository.port';
import { IEstablishmentRepository } from './ports/establishment-repository.port';

export interface CampaignAnalyticsResult {
  campaign_id: string;
  budget_gross: number;
  budget_consumed: number;
  budget_returned: number;
  unique_visits: number;
  cpv: number;
  coins_collected: number;
  coins_total: number;
}

@Injectable()
export class GetCampaignAnalyticsUseCase {
  constructor(
    @Inject(TOKENS.CAMPAIGN_REPOSITORY) private readonly campaigns: ICampaignRepository,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY) private readonly coins: IFinancialCoinRepository,
    @Inject(TOKENS.MERCHANT_WALLET_REPOSITORY) private readonly wallets: IMerchantWalletRepository,
    @Inject(TOKENS.ESTABLISHMENT_REPOSITORY) private readonly establishments: IEstablishmentRepository,
  ) {}

  async execute(campaignId: string): Promise<CampaignAnalyticsResult> {
    const campaign = await this.campaigns.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campanha não encontrada');

    if (campaign.status !== CampaignStatus.FINISHED) {
      await this.campaigns.updateStatus(campaignId, CampaignStatus.FINISHED);
    }

    const uncollectedCoins = await this.coins.findUncollectedByCampaign(campaignId);
    const uncollectedValue = await this.coins.sumUncollected(campaignId);
    const allCoins = uncollectedCoins.length;

    const budgetConsumed = campaign.budget_net - uncollectedValue;
    const uniqueVisits = await this.getUniqueVisits(campaignId);
    const cpv = uniqueVisits > 0 ? campaign.budget_gross / uniqueVisits : 0;

    if (uncollectedValue > 0) {
      const est = await this.establishments.findById(campaign.establishment_id!);
      if (est) {
        await this.wallets.credit(est.cnpj_root, uncollectedValue);
      }
    }

    return {
      campaign_id: campaignId,
      budget_gross: campaign.budget_gross,
      budget_consumed: budgetConsumed,
      budget_returned: uncollectedValue,
      unique_visits: uniqueVisits,
      cpv: Math.round(cpv * 100) / 100,
      coins_collected: 0,
      coins_total: allCoins,
    };
  }

  private async getUniqueVisits(_campaignId: string): Promise<number> {
    return 0;
  }
}
