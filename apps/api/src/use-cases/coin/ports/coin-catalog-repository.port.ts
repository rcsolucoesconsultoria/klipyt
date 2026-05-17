import { CoinCatalog } from '../../../domain/entities/coin-catalog.entity';

export interface ICoinCatalogRepository {
  save(catalog: Partial<CoinCatalog>): Promise<CoinCatalog>;
  findById(id: string): Promise<CoinCatalog | null>;
}
