import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FinancialCoin } from '../../../domain/entities/financial-coin.entity';
import { IFinancialCoinRepository } from '../../../use-cases/campaign/ports/financial-coin-repository.port';
import { IFinancialCoinCollectPort } from '../../../use-cases/collect/ports/financial-coin-collect.port';

@Injectable()
export class FinancialCoinRepository
  implements IFinancialCoinRepository, IFinancialCoinCollectPort
{
  constructor(
    @InjectRepository(FinancialCoin)
    private readonly repo: Repository<FinancialCoin>,
  ) {}

  async findById(id: string) {
    const coin = await this.repo.findOne({ where: { id } });
    if (!coin) return null;
    return {
      id: coin.id,
      value: Number(coin.value),
      campaign_id: coin.campaign_id!,
      collected_by: coin.collected_by,
    };
  }

  async findUncollectedByCampaign(campaignId: string): Promise<FinancialCoin[]> {
    return this.repo.find({
      where: { campaign_id: campaignId, collected_by: IsNull() },
    });
  }

  async saveMany(coins: Partial<FinancialCoin>[]): Promise<FinancialCoin[]> {
    const entities = coins.map((c) => this.repo.create(c));
    return this.repo.save(entities);
  }

  async markCollected(coinId: string, userId: string): Promise<void> {
    await this.repo.update(coinId, {
      collected_by: userId,
      collected_at: new Date(),
    });
  }

  async distanceMeters(coinId: string, lat: number, lon: number): Promise<number> {
    const [row] = await this.repo.query(
      `SELECT ST_Distance(
         geom::geography,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       ) AS distance
       FROM financial_coins WHERE id = $3`,
      [lon, lat, coinId],
    );
    return row ? parseFloat(row.distance) : 999999;
  }

  async sumUncollected(campaignId: string): Promise<number> {
    const [row] = await this.repo.query(
      `SELECT COALESCE(SUM(value), 0) AS total
       FROM financial_coins
       WHERE campaign_id = $1 AND collected_by IS NULL`,
      [campaignId],
    );
    return row ? parseFloat(row.total) : 0;
  }

  async getEstablishmentIdByCoin(coinId: string): Promise<string | null> {
    const [row] = await this.repo.query(
      `SELECT c.establishment_id
       FROM financial_coins fc
       JOIN campaigns c ON c.id = fc.campaign_id
       WHERE fc.id = $1`,
      [coinId],
    );
    return row?.establishment_id ?? null;
  }
}
