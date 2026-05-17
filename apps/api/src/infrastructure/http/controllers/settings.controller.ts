import { Controller, Get, Inject } from '@nestjs/common';
import { IPlatformSettingRepository } from '../../../use-cases/settings/platform-setting-repository.port';
import { TOKENS } from '../../../use-cases/tokens';

@Controller('settings')
export class SettingsController {
  constructor(
    @Inject(TOKENS.PLATFORM_SETTING_REPOSITORY)
    private readonly settingsRepo: IPlatformSettingRepository,
  ) {}

  @Get('public')
  async getPublicSettings() {
    const all = await this.settingsRepo.findAll();
    const result: Record<string, any> = {};
    for (const s of all) {
      result[s.setting_key] = s.setting_value;
    }
    return result;
  }
}
