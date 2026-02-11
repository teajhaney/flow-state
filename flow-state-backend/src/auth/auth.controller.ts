import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Public } from './decorators/public.decorator';
import { AuthenticatedUser, JwtPayload } from './types/auth-types';

// Cookie configuration for the refresh token.
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true, //prevents client-side JS from reading the cookie (XSS protection)
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth', //restricts the cookie to auth routes only
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Register a new user.
  @Public()
  @Post('signup')
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signUp(dto);

    res.cookie('refresh_token', tokens.refresh_token, REFRESH_COOKIE_OPTIONS);

    return { access_token: tokens.access_token };
  }

  // Authenticate a user. Returns access_token in body,
  // sets refresh_token as HTTP-only cookie.
  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() dto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.signIn(dto);

    res.cookie('refresh_token', tokens.refresh_token, REFRESH_COOKIE_OPTIONS);

    return { access_token: tokens.access_token };
  }

  // Refresh the access token using the refresh_token cookie.
  // Returns a new access_token and rotates the refresh_token cookie.
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.['refresh_token'];

    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'No refresh token provided',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      return;
    }

    // Decode and verify the refresh token using the service helper
    let payload: JwtPayload;
    try {
      payload = this.authService.verifyRefreshToken(refreshToken);
    } catch {
      res.clearCookie('refresh_token', { path: '/auth' });
      res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Invalid refresh token',
        statusCode: HttpStatus.UNAUTHORIZED,
      });
      return;
    }

    const tokens = await this.authService.refreshTokens(
      payload.sub,
      refreshToken,
    );

    res.cookie('refresh_token', tokens.refresh_token, REFRESH_COOKIE_OPTIONS);

    return { access_token: tokens.access_token };
  }

  // Clears the refresh token cookie and revokes the token in the database.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as AuthenticatedUser;

    await this.authService.logout(user.userId);

    res.clearCookie('refresh_token', { path: '/auth' });

    return { message: 'Logged out successfully' };
  }
}
