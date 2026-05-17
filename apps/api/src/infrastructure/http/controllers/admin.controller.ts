import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IPlatformSettingRepository } from '../../../use-cases/settings/platform-setting-repository.port';
import { TOKENS } from '../../../use-cases/tokens';

class UpdateSettingDto {
  value: any;
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    @Inject(TOKENS.PLATFORM_SETTING_REPOSITORY)
    private readonly settingsRepo: IPlatformSettingRepository,
  ) {}

  @Get()
  async getAll() {
    const all = await this.settingsRepo.findAll();
    return Object.fromEntries(all.map((s) => [s.setting_key, s.setting_value]));
  }

  // RN01: Take rate só afeta campanhas novas
  @Patch('global-margin')
  async updateMargin(@Body() dto: UpdateSettingDto) {
    const v = parseFloat(dto.value);
    if (v < 0 || v > 1) return { error: 'global_margin deve estar entre 0 e 1' };
    await this.settingsRepo.upsert('global_margin', v);
    return { global_margin: v };
  }

  // RF14: Liga/desliga monetização no PWA
  @Patch('fase-monetizacao')
  async updateFase(@Body() dto: UpdateSettingDto) {
    await this.settingsRepo.upsert('fase_monetizacao_ativa', Boolean(dto.value));
    return { fase_monetizacao_ativa: Boolean(dto.value) };
  }

  // RF10: Tema sazonal
  @Patch('tema')
  async updateTema(@Body() dto: UpdateSettingDto) {
    const valid = ['COPA', 'NAMORADOS', 'BLACK_FRIDAY', 'NATAL'];
    if (!valid.includes(dto.value)) {
      return { error: `Temas válidos: ${valid.join(', ')}` };
    }
    await this.settingsRepo.upsert('tema_ativo', dto.value);
    return { tema_ativo: dto.value };
  }
}
