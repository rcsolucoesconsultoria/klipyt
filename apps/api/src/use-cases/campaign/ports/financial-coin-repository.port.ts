import { FinancialCoin } from '../../../domain/entities/financial-coin.entity';

export interface IFinancialCoinRepository {
  findById(id: string): Promise<FinancialCoin | null | { id: string; value: number; campaign_id: string; collected_by: string | null }>;
  findRawById(id: string): Promise<FinancialCoin | null>;
  findUncollectedByCampaign(campaignId: string): Promise<FinancialCoin[]>;
  saveMany(coins: Partial<FinancialCoin>[]): Promise<FinancialCoin[]>;
  markCollected(coinId: string, userId: string): Promise<void>;
  setOwner(coinId: string, userId: string): Promise<void>;
  transferOwner(coinId: string, fromUserId: string, toUserId: string): Promise<boolean>;
  distanceMeters(coinId: string, lat: number, lon: number): Promise<number>;
  sumUncollected(campaignId: string): Promise<number>;
  findOwnedTradeable(userId: string): Promise<
    Array<{ id: string; value: number; is_qualified: boolean; campaign_id: string | null }>
  >;
}
