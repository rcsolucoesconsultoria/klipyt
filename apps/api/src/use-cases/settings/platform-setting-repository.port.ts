import { PlatformSetting } from '../../domain/entities/platform-setting.entity';

export interface IPlatformSettingRepository {
  findByKey(key: string): Promise<PlatformSetting | null>;
  findAll(): Promise<PlatformSetting[]>;
  upsert(key: string, value: any): Promise<void>;
}
