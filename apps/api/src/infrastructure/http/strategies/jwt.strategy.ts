import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '../../../domain/enums/user-status.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  status: UserStatus;
  faixa_etaria?: string | null;
}

export interface JwtUser {
  id: string;
  email: string;
  status: UserStatus;
  faixa_etaria: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'changeme_in_production',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      id: payload.sub,
      email: payload.email,
      status: payload.status,
      faixa_etaria: payload.faixa_etaria ?? null,
    };
  }
}
