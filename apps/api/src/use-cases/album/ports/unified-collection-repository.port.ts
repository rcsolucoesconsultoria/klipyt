import { AssetType } from '../../../domain/enums/asset-type.enum';
import { UnifiedCollection } from '../../../domain/entities/unified-collection.entity';

export interface IUnifiedCollectionRepository {
  countToday(
    userId: string,
    establishmentId: string,
    assetType: AssetType,
  ): Promise<number>;
  register(
    userId: string,
    establishmentId: string,
    assetType: AssetType,
  ): Promise<UnifiedCollection>;
}
