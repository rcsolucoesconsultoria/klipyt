import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoinCatalog } from '../../../domain/entities/coin-catalog.entity';
import { ICoinCatalogRepository } from '../../../use-cases/coin/ports/coin-catalog-repository.port';

@Injectable()
export class CoinCatalogRepository implements ICoinCatalogRepository {
  constructor(
    @InjectRepository(CoinCatalog)
    private readonly repo: Repository<CoinCatalog>,
  ) {}

  save(catalog: Partial<CoinCatalog>): Promise<CoinCatalog> {
    return this.repo.save(this.repo.create(catalog));
  }

  findById(id: string): Promise<CoinCatalog | null> {
    return this.repo.findOne({ where: { id } });
  }
}
