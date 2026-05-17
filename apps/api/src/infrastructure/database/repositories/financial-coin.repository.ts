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

  async findRawById(id: string): Promise<FinancialCoin | null> {
    return this.repo.findOne({ where: { id } });
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
      owner_user_id: userId,
      collected_at: new Date(),
    });
  }

  async setOwner(coinId: string, userId: string): Promise<void> {
    await this.repo.update(coinId, { owner_user_id: userId });
  }

  async transferOwner(coinId: string, fromUserId: string, toUserId: string): Promise<boolean> {
    const result = await this.repo.update(
      { id: coinId, owner_user_id: fromUserId },
      { owner_user_id: toUserId },
    );
    return (result.affected ?? 0) > 0;
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

  async findOwnedTradeable(userId: string) {
    const rows = await this.repo.query(
      `SELECT fc.id, fc.value, fc.is_qualified, fc.campaign_id
       FROM financial_coins fc
       WHERE fc.owner_user_id = $1
         AND NOT EXISTS (
           SELECT 1 FROM marketplace_orders mo
           WHERE mo.coin_id = fc.id AND mo.status = 'LISTED'
         )
       ORDER BY fc.collected_at DESC NULLS LAST`,
      [userId],
    );
    return rows.map((r: any) => ({
      id: r.id,
      value: parseFloat(r.value),
      is_qualified: r.is_qualified,
      campaign_id: r.campaign_id,
    }));
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
