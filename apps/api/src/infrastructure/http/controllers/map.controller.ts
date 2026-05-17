import { Controller, Get, Inject, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GetMapLayersUseCase } from '../../../use-cases/map/get-map-layers.use-case';
import { TOKENS } from '../../../use-cases/tokens';
import { IFinancialCoinRepository } from '../../../use-cases/campaign/ports/financial-coin-repository.port';
import { ICampaignRepository } from '../../../use-cases/campaign/ports/campaign-repository.port';

@Controller('map')
@UseGuards(JwtAuthGuard)
export class MapController {
  constructor(
    private readonly getMapLayers: GetMapLayersUseCase,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY)
    private readonly coins: IFinancialCoinRepository,
    @Inject(TOKENS.CAMPAIGN_REPOSITORY)
    private readonly campaigns: ICampaignRepository,
  ) {}

  @Get('layers')
  getLayers(
    @CurrentUser() user: { id: string; faixa_etaria?: string },
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    return this.getMapLayers.execute({
      userId: user.id,
      faixa_etaria: user.faixa_etaria ?? null,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    });
  }

  /** Retorna o vídeo da campanha associada à moeda — usado pelo CoinCaptureModal (RF07) */
  @Get('coin/:id/campaign')
  async getCoinCampaign(@Param('id') coinId: string) {
    const coin = await (this.coins as any).findRawById?.(coinId)
      ?? await this.coins.findById(coinId) as any;
    if (!coin) throw new NotFoundException('Moeda não encontrada');

    const campaignId = coin.campaign_id;
    if (!campaignId) return { video_url: null };

    const campaign = await this.campaigns.findById(campaignId);
    return { video_url: campaign?.video_url ?? null };
  }
}
