import { Inject, Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { TOKENS } from '../tokens';
import { IPlatformSettingRepository } from '../settings/platform-setting-repository.port';

export interface MapLayerInput {
  userId: string;
  faixa_etaria: string | null;
  lat: number;
  lon: number;
}

export interface CoinMapItem {
  id: string;
  lat: number;
  lon: number;
  value: number;
  is_qualified: boolean;
  coin_type: 'BRONZE' | 'GOLD';
}

export interface PackMapItem {
  id: string;
  lat: number;
  lon: number;
}

export interface BillboardMapItem {
  id: string;
  lat: number;
  lon: number;
  title: string;
  density_tier: string;
}

export interface MapLayersResult {
  coins: CoinMapItem[];
  packs: PackMapItem[];
  billboards: BillboardMapItem[];
  fase_monetizacao_ativa: boolean;
}

const RADIUS_KM = 5;

@Injectable()
export class GetMapLayersUseCase {
  constructor(
    @Inject(TOKENS.PLATFORM_SETTING_REPOSITORY)
    private readonly settings: IPlatformSettingRepository,
    private readonly redis: RedisService,
  ) {}

  async execute(input: MapLayerInput): Promise<MapLayersResult> {
    const faseSetting = await this.settings.findByKey('fase_monetizacao_ativa');
    const faseAtiva: boolean = faseSetting ? Boolean(faseSetting.setting_value) : false;

    const packs: PackMapItem[] = [];
    if (!faseAtiva) {
      const packIds = await this.redis.geosearch(
        'active_packs:geo',
        input.lon,
        input.lat,
        RADIUS_KM,
      );
      for (const packId of packIds) {
        const pos = await this.redis.geopos('active_packs:geo', packId);
        if (pos) packs.push({ id: packId, lat: pos[1], lon: pos[0] });
      }
    }

    const coins: CoinMapItem[] = [];
    if (faseAtiva) {
      const coinIds = await this.redis.geosearch(
        'active_coins:geo',
        input.lon,
        input.lat,
        RADIUS_KM,
      );
      for (const coinId of coinIds) {
        const pos = await this.redis.geopos('active_coins:geo', coinId);
        if (!pos) continue;

        const meta = await this.getCoinMeta(coinId);
        if (!meta) continue;

        // RF06: ocultar baús qualificados para usuários fora do perfil
        if (
          meta.is_qualified &&
          meta.age_restriction === 35 &&
          input.faixa_etaria !== '35+'
        ) {
          continue;
        }

        coins.push({
          id: coinId,
          lat: pos[1],
          lon: pos[0],
          value: meta.value,
          is_qualified: meta.is_qualified,
          coin_type: meta.is_qualified ? 'GOLD' : 'BRONZE',
        });
      }
    }

    const billboards: BillboardMapItem[] = [];
    const billboardIds = await this.redis.geosearch(
      'billboards:geo',
      input.lon,
      input.lat,
      RADIUS_KM,
    );
    for (const billboardId of billboardIds) {
      const pos = await this.redis.geopos('billboards:geo', billboardId);
      if (!pos) continue;
      const meta = await this.redis.hgetall(`billboard:${billboardId}:meta`);
      billboards.push({
        id: billboardId,
        lat: pos[1],
        lon: pos[0],
        title: meta.title ?? 'Outdoor',
        density_tier: meta.density_tier ?? 'PRATA',
      });
    }

    return { coins, packs, billboards, fase_monetizacao_ativa: faseAtiva };
  }

  private async getCoinMeta(coinId: string) {
    const allCampaignKeys = await this.redis.keys('campaign:*:coins');
    for (const key of allCampaignKeys) {
      const raw = await this.redis.hget(key, coinId);
      if (raw) return JSON.parse(raw) as { value: number; is_qualified: boolean; age_restriction: number };
    }
    return null;
  }
}
