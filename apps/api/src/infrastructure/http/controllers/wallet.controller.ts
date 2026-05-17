import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { WithdrawPixUseCase } from '../../../use-cases/wallet/withdraw-pix.use-case';
import { IUserRepository } from '../../../use-cases/auth/ports/user-repository.port';
import { TOKENS } from '../../../use-cases/tokens';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private readonly withdraw: WithdrawPixUseCase,
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: { id: string }) {
    const u = await this.users.findById(user.id);
    return {
      wallet_balance: u?.wallet_balance ?? 0,
      can_withdraw: Number(u?.wallet_balance ?? 0) >= 6.0,
      min_withdraw: 6.0,
    };
  }

  @Post('withdraw')
  withdrawHandler(@CurrentUser() user: { id: string }) {
    return this.withdraw.execute(user.id);
  }
}
