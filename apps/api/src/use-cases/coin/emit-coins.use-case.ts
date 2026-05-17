import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus } from '../../domain/enums/campaign-status.enum';
import { Rarity } from '../../domain/enums/rarity.enum';
import { SmartBlendingCalculatorService } from '../../domain/services/smart-blending-calculator.service';
import { Money } from '../../domain/value-objects/money.vo';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { ICampaignRepository } from '../campaign/ports/campaign-repository.port';
import { IEstablishmentRepository } from '../campaign/ports/establishment-repository.port';
import { IFinancialCoinRepository } from '../campaign/ports/financial-coin-repository.port';
import { IPlatformSettingRepository } from '../settings/platform-setting-repository.port';
import { ICoinCatalogRepository } from './ports/coin-catalog-repository.port';

export interface EmitCoinsInput {
  establishmentId: string;
  title: string;
  budgetGross: number;
  videoUrl: string;
  startTime: Date;
  endTime: Date;
  ageRestriction?: number;
}

export interface EmitCoinsResult {
  catalogId: string;
  campaignId: string;
  quantityIssued: number;
  budgetNet: number;
  stockKey: string;
}

const QUALIFIED_COIN_VALUE = 3.0;
const VOLUME_COIN_VALUE = 0.5;
const GEO_SPREAD_DEGREES = 0.0003;

@Injectable()
export class EmitCoinsUseCase {
  constructor(
    @Inject(TOKENS.COIN_CATALOG_REPOSITORY) private readonly catalogs: ICoinCatalogRepository,
    @Inject(TOKENS.CAMPAIGN_REPOSITORY) private readonly campaigns: ICampaignRepository,
    @Inject(TOKENS.FINANCIAL_COIN_REPOSITORY) private readonly coins: IFinancialCoinRepository,
    @Inject(TOKENS.ESTABLISHMENT_REPOSITORY) private readonly establishments: IEstablishmentRepository,
    @Inject(TOKENS.PLATFORM_SETTING_REPOSITORY) private readonly settings: IPlatformSettingRepository,
    private readonly blending: SmartBlendingCalculatorService,
    private readonly redis: RedisService,
  ) {}

  async execute(input: EmitCoinsInput): Promise<EmitCoinsResult> {
    const est = await this.establishments.findById(input.establishmentId);
    if (!est) throw new NotFoundException('Estabelecimento não encontrado');

    const windowHours = (input.endTime.getTime() - input.startTime.getTime()) / 3600000;
    if (windowHours > 6) {
      throw new BadRequestException('A janela de emissão não pode exceder 6 horas');
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

    const totalCoins = result.qualifiedCoinCount + result.volumeCoinCount;
    const catalog = await this.catalogs.save({
      campaign_id: campaign.id!,
      establishment_id: input.establishmentId,
      title: input.title,
      face_value: QUALIFIED_COIN_VALUE,
      budget_gross: input.budgetGross,
      budget_net: result.qualifiedPool.toNumber() + result.volumePool.toNumber(),
      quantity_issued: totalCoins,
      rarity: Rarity.COMMON,
    });

    const estCoords = this.parseGeom(est.geom);
    const coinPayloads = this.generateCoins(
      campaign.id!,
      catalog.id,
      estCoords,
      result.qualifiedCoinCount,
      QUALIFIED_COIN_VALUE,
      true,
      result.volumeCoinCount,
      VOLUME_COIN_VALUE,
      false,
    );

    const saved = await this.coins.saveMany(coinPayloads);
    const stockKey = `coin:stock:${catalog.id}`;
    await this.redis.set(stockKey, String(saved.length));

    const ttlSeconds = Math.ceil((input.endTime.getTime() - Date.now()) / 1000);
    for (const coin of saved) {
      const coords = this.parseGeom(coin.geom);
      await this.redis.geoadd('active_coins:geo', coords.lon, coords.lat, coin.id!);
      await this.redis.hset(`campaign:${campaign.id}:coins`, {
        [coin.id!]: JSON.stringify({
          value: coin.value,
          is_qualified: coin.is_qualified ? 1 : 0,
          age_restriction: input.ageRestriction ?? 0,
          establishment_id: input.establishmentId,
          campaign_id: campaign.id,
          catalog_id: catalog.id,
        }),
      });
    }
    if (ttlSeconds > 0) {
      await this.redis.expire('active_coins:geo', ttlSeconds);
      await this.redis.expire(stockKey, ttlSeconds);
    }

    return {
      catalogId: catalog.id,
      campaignId: campaign.id!,
      quantityIssued: saved.length,
      budgetNet: catalog.budget_net,
      stockKey,
    };
  }

  private generateCoins(
    campaignId: string,
    catalogId: string,
    center: { lat: number; lon: number },
    qualCount: number,
    qualValue: number,
    qualIsQualified: boolean,
    volCount: number,
    volValue: number,
    volIsQualified: boolean,
  ) {
    const coins: Partial<import('../../domain/entities/financial-coin.entity').FinancialCoin>[] = [];
    for (let i = 0; i < qualCount; i++) {
      const spread = 0.0001;
      const lat = center.lat + (Math.random() - 0.5) * spread;
      const lon = center.lon + (Math.random() - 0.5) * spread;
      coins.push({
        campaign_id: campaignId,
        catalog_id: catalogId,
        value: qualValue,
        is_qualified: qualIsQualified,
        geom: `SRID=4326;POINT(${lon} ${lat})`,
      });
    }
    for (let i = 0; i < volCount; i++) {
      const lat = center.lat + (Math.random() - 0.5) * GEO_SPREAD_DEGREES;
      const lon = center.lon + (Math.random() - 0.5) * GEO_SPREAD_DEGREES;
      coins.push({
        campaign_id: campaignId,
        catalog_id: catalogId,
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
