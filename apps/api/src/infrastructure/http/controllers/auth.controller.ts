import { Controller, Get, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { GoogleOAuthGuard } from '../guards/google-oauth.guard';

@Controller('auth')
export class AuthController {
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleLogin() {
    // Passport redireciona para o Google automaticamente
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(200)
  googleCallback(@Req() req: any, @Res() res: Response) {
    const { access_token, user } = req.user;

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${clientUrl}/auth/callback?token=${access_token}&status=${user.status}`,
    );
  }
}
