import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../domain/enums/campaign-status.enum';
import { SmartBlendingCalculatorService } from '../../domain/services/smart-blending-calculator.service';
import { Money } from '../../domain/value-objects/money.vo';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { ICampaignRepository } from './ports/campaign-repository.port';
import { IFinancialCoinRepository } from './ports/financial-coin-repository.port';
import { IPlatformSettingRepository } from '../settings/platform-setting-repository.port';
import { IEstablishmentRepository } from './ports/establishment-repository.port';

export interface CreateCampaignInput {
  establishmentId: string;
  budgetGross: number;
  videoUrl: string;
  startTime: Date;
  endTime: Date;
  ageRestriction?: number;
}

export interface CreateCampaignResult {
  campaignId: string;
  budgetNet: number;
  platformRevenue: number;
  qualifiedCoinCount: number;
  volumeCoinCount: number;
}

const QUALIFIED_COIN_VALUE = 3.0;
const VOLUME_COIN_VALUE = 0.5;
const GEO_SPREAD_DEGREES = 0.0003;

@Injectable()
export class CreateCampaignUseCase {
  constructor(
    @Inject(TOKENS.CAMPAIGN_REPOSITORY) private readonly campaigns: ICampaignRepository,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY) private readonly coins: IFinancialCoinRepository,
    @Inject(TOKENS.ESTABLISHMENT_REPOSITORY) private readonly establishments: IEstablishmentRepository,
    @Inject(TOKENS.PLATFORM_SETTING_REPOSITORY) private readonly settings: IPlatformSettingRepository,
    private readonly blending: SmartBlendingCalculatorService,
    private readonly redis: RedisService,
  ) {}

  async execute(input: CreateCampaignInput): Promise<CreateCampaignResult> {
    const est = await this.establishments.findById(input.establishmentId);
    if (!est) throw new NotFoundException('Estabelecimento não encontrado');

    const windowHours =
      (input.endTime.getTime() - input.startTime.getTime()) / 3600000;
    if (windowHours > 6) {
      throw new BadRequestException(
        'A janela da campanha não pode exceder 6 horas (RF02)',
      );
    }

    const marginSetting = await this.settings.findByKey('global_margin');
    const globalMargin = marginSetting ? Number(marginSetting.setting_value) : 0.4;

    const result = this.blending.calculate(
      new Money(input.budgetGross),
      globalMargin,
      QUALIFIED_COIN_VALUE,
      VOLUME_COIN_VALUE,
    );

    const campaign = await this.campaigns.save({
      establishment_id: input.establishmentId,
      budget_gross: input.budgetGross,
      budget_net: result.qualifiedPool.toNumber() + result.volumePool.toNumber(),
      app_margin_percent: globalMargin * 100,
      video_url: input.videoUrl,
      start_time: input.startTime,
      end_time: input.endTime,
      age_restriction: input.ageRestriction ?? null,
      status: CampaignStatus.ACTIVE,
    });

    const estCoords = this.parseGeom(est.geom);
    const coinPayloads = this.generateCoins(
      campaign.id!,
      estCoords,
      result.qualifiedCoinCount,
      QUALIFIED_COIN_VALUE,
      true,
      result.volumeCoinCount,
      VOLUME_COIN_VALUE,
      false,
    );

    const saved = await this.coins.saveMany(coinPayloads);
    const ttlSeconds = Math.ceil(
      (input.endTime.getTime() - Date.now()) / 1000,
    );

    for (const coin of saved) {
      const coords = this.parseGeom(coin.geom);
      await this.redis.geoadd(
        'active_coins:geo',
        coords.lon,
        coords.lat,
        coin.id!,
      );
      await this.redis.hset(`campaign:${campaign.id}:coins`, {
        [coin.id!]: JSON.stringify({
          value: coin.value,
          is_qualified: coin.is_qualified ? 1 : 0,
          age_restriction: input.ageRestriction ?? 0,
          establishment_id: input.establishmentId,
          campaign_id: campaign.id,
        }),
      });
    }

    if (ttlSeconds > 0) {
      await this.redis.expire('active_coins:geo', ttlSeconds);
    }

    return {
      campaignId: campaign.id!,
      budgetNet: result.qualifiedPool.toNumber() + result.volumePool.toNumber(),
      platformRevenue: result.platformRevenue.toNumber(),
      qualifiedCoinCount: result.qualifiedCoinCount,
      volumeCoinCount: result.volumeCoinCount,
    };
  }

  private generateCoins(
    campaignId: string,
    center: { lat: number; lon: number },
    qualCount: number,
    qualValue: number,
    qualIsQualified: boolean,
    volCount: number,
    volValue: number,
    volIsQualified: boolean,
  ) {
    const coins: any[] = [];
    // Qualified coins: inside/near PDV (±0.0001° ~ 10m)
    for (let i = 0; i < qualCount; i++) {
      const spread = 0.0001;
      const lat = center.lat + (Math.random() - 0.5) * spread;
      const lon = center.lon + (Math.random() - 0.5) * spread;
      coins.push({
        campaign_id: campaignId,
        value: qualValue,
        is_qualified: qualIsQualified,
        geom: `SRID=4326;POINT(${lon} ${lat})`,
      });
    }
    // Volume coins: sidewalk/facade (±0.0003° ~ 30m)
    for (let i = 0; i < volCount; i++) {
      const lat = center.lat + (Math.random() - 0.5) * GEO_SPREAD_DEGREES;
      const lon = center.lon + (Math.random() - 0.5) * GEO_SPREAD_DEGREES;
      coins.push({
        campaign_id: campaignId,
        value: volValue,
        is_qualified: volIsQualified,
        geom: `SRID=4326;POINT(${lon} ${lat})`,
      });
    }
    return coins;
  }

  private parseGeom(geom: string): { lat: number; lon: number } {
    const m = geom.match(/POINT\(([^\s]+)\s+([^\s)]+)\)/i);
    if (m) return { lon: parseFloat(m[1]), lat: parseFloat(m[2]) };
    const obj = typeof geom === 'string' ? JSON.parse(geom) : geom;
    if (obj?.coordinates) return { lon: obj.coordinates[0], lat: obj.coordinates[1] };
    throw new Error('Geom inválida');
  }
}
