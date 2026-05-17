import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { GoogleLoginUseCase } from '../../../use-cases/auth/google-login.use-case';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly googleLogin: GoogleLoginUseCase,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET')?.trim();
    if (!clientID || !clientSecret) {
      console.warn(
        '[Auth] GOOGLE_CLIENT_ID/SECRET ausentes — login Google desativado. Preencha o .env na raiz do repo.',
      );
    }
    super({
      clientID: clientID || 'dev-google-not-configured',
      clientSecret: clientSecret || 'dev-google-not-configured',
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3000/api/v1/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    const full_name = profile.displayName ?? profile.name?.givenName ?? 'Usuário';
    const avatar_url = profile.photos?.[0]?.value ?? null;

    return this.googleLogin.execute({ email: email!, full_name, avatar_url });
  }
}
