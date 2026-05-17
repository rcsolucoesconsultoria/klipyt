import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IUserRepository } from '../../../use-cases/auth/ports/user-repository.port';
import { UpgradeAccountUseCase } from '../../../use-cases/user/upgrade-account.use-case';
import { TOKENS } from '../../../use-cases/tokens';
import { UpgradeAccountDto } from '../dto/upgrade.dto';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly upgradeAccount: UpgradeAccountUseCase,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    const u = await this.users.findById(user.id);
    if (!u) return null;
    const { cpf, pix_key, ...safe } = u;
    return {
      ...safe,
      cpf: cpf ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : null,
      has_pix_key: !!pix_key,
    };
  }

  @Post('upgrade')
  upgradeHandler(
    @CurrentUser() user: { id: string },
    @Body() dto: UpgradeAccountDto,
  ) {
    return this.upgradeAccount.execute({
      userId: user.id,
      rawCpf: dto.cpf,
      pixKey: dto.pix_key,
    });
  }
}
