export interface IFinancialCoinCollectPort {
  findById(id: string): Promise<{ id: string; value: number; campaign_id: string; collected_by: string | null } | null>;
  markCollected(coinId: string, userId: string): Promise<void>;
  distanceMeters(coinId: string, lat: number, lon: number): Promise<number>;
  getEstablishmentIdByCoin(coinId: string): Promise<string | null>;
}
