import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSetting } from '../../../domain/entities/platform-setting.entity';
import { IPlatformSettingRepository } from '../../../use-cases/settings/platform-setting-repository.port';

@Injectable()
export class PlatformSettingRepository implements IPlatformSettingRepository {
  constructor(
    @InjectRepository(PlatformSetting)
    private readonly repo: Repository<PlatformSetting>,
  ) {}

  async findByKey(key: string): Promise<PlatformSetting | null> {
    return this.repo.findOne({ where: { setting_key: key } });
  }

  async findAll(): Promise<PlatformSetting[]> {
    return this.repo.find();
  }

  async upsert(key: string, value: any): Promise<void> {
    await this.repo.save(
      this.repo.create({ setting_key: key, setting_value: value }),
    );
  }
}
