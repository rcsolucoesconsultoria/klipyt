import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { IUserRepository } from '../../../use-cases/auth/ports/user-repository.port';
import { TOKENS } from '../../../use-cases/tokens';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY)
    private readonly users: IUserRepository,
  ) {}

  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.users.findById(user.id);
  }
}
