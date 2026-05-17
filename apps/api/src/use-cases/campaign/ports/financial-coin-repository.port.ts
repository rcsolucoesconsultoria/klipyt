import { FinancialCoin } from '../../../domain/entities/financial-coin.entity';

export interface IFinancialCoinRepository {
  findById(id: string): Promise<FinancialCoin | null | { id: string; value: number; campaign_id: string; collected_by: string | null }>;
  findUncollectedByCampaign(campaignId: string): Promise<FinancialCoin[]>;
  saveMany(coins: Partial<FinancialCoin>[]): Promise<FinancialCoin[]>;
  markCollected(coinId: string, userId: string): Promise<void>;
  distanceMeters(coinId: string, lat: number, lon: number): Promise<number>;
  sumUncollected(campaignId: string): Promise<number>;
}
