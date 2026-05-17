import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Campaign } from '../../../domain/entities/campaign.entity';
import { CampaignStatus } from '../../../domain/enums/campaign-status.enum';
import { ICampaignRepository } from '../../../use-cases/campaign/ports/campaign-repository.port';

@Injectable()
export class CampaignRepository implements ICampaignRepository {
  constructor(
    @InjectRepository(Campaign)
    private readonly repo: Repository<Campaign>,
  ) {}

  async findById(id: string): Promise<Campaign | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findActiveByEstablishment(establishmentId: string): Promise<Campaign[]> {
    return this.repo.find({
      where: { establishment_id: establishmentId, status: CampaignStatus.ACTIVE },
    });
  }

  async save(data: Partial<Campaign>): Promise<Campaign> {
    return this.repo.save(this.repo.create(data));
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<void> {
    await this.repo.update(id, { status });
  }

  async findExpired(): Promise<Campaign[]> {
    return this.repo.find({
      where: { status: CampaignStatus.ACTIVE, end_time: LessThan(new Date()) },
    });
  }
}
