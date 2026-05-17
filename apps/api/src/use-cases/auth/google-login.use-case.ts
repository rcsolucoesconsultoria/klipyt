import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { IUserRepository } from './ports/user-repository.port';
import { TOKENS } from '../tokens';

export interface GoogleProfile {
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export interface AuthResult {
  access_token: string;
  user: Pick<User, 'id' | 'email' | 'full_name' | 'avatar_url' | 'status'>;
}

@Injectable()
export class GoogleLoginUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly jwt: JwtService,
  ) {}

  async execute(profile: GoogleProfile): Promise<AuthResult> {
    let user = await this.users.findByEmail(profile.email);

    if (!user) {
      user = await this.users.save({
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        status: UserStatus.INCOMPLETE,
        cpf: null,
        birth_date: null,
        pix_key: null,
        faixa_etaria: null,
        wallet_balance: 0,
        fraud_flag: false,
      });
    }

    const payload = {
      sub: user.id,
      email: user.email,
      status: user.status,
      faixa_etaria: user.faixa_etaria ?? null,
    };
    const access_token = this.jwt.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        status: user.status,
      },
    };
  }
}
