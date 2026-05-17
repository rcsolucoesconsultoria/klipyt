import { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../../domain/enums/campaign-status.enum';

export interface ICampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findActiveByEstablishment(establishmentId: string): Promise<Campaign[]>;
  save(data: Partial<Campaign>): Promise<Campaign>;
  updateStatus(id: string, status: CampaignStatus): Promise<void>;
  findExpired(): Promise<Campaign[]>;
}
