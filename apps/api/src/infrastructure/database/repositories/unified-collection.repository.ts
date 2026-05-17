import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnifiedCollection } from '../../../domain/entities/unified-collection.entity';
import { AssetType } from '../../../domain/enums/asset-type.enum';
import { IUnifiedCollectionRepository } from '../../../use-cases/album/ports/unified-collection-repository.port';

@Injectable()
export class UnifiedCollectionRepository implements IUnifiedCollectionRepository {
  constructor(
    @InjectRepository(UnifiedCollection)
    private readonly repo: Repository<UnifiedCollection>,
  ) {}

  async countToday(
    userId: string,
    establishmentId: string,
    assetType: AssetType,
  ): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.repo
      .createQueryBuilder('uc')
      .where('uc.user_id = :userId', { userId })
      .andWhere('uc.establishment_id = :establishmentId', { establishmentId })
      .andWhere('uc.asset_type = :assetType', { assetType })
      .andWhere('uc.collected_at >= :today', { today })
      .andWhere('uc.collected_at < :tomorrow', { tomorrow })
      .getCount();
  }

  async register(
    userId: string,
    establishmentId: string,
    assetType: AssetType,
  ): Promise<UnifiedCollection> {
    return this.repo.save(
      this.repo.create({ user_id: userId, establishment_id: establishmentId, asset_type: assetType }),
    );
  }
}
