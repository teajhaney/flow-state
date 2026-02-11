import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { JwtPayload } from './types/auth-types';

/**
 * AuthService handles user registration, authentication,
 * and token management using the Access + Refresh Token pattern.
 */
@Injectable()
export class AuthService {
  constructor(
    public prisma: PrismaService,
    public jwtService: JwtService,
    public config: ConfigService,
  ) {}

  // Register a new user.
  async signUp(dto: SignUpDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // Authenticate an existing user.
  async signIn(dto: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    //Verifies credentials
    const isPasswordValid = await argon2.verify(user.password, dto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    //stores the hashed refresh token in the database.
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  /**
   * Logout the user by nulling the refresh token in the database.
   * This effectively revokes the refresh token — even if the cookie
   * still exists, it won't match any stored hash.
   */
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // Verified a refresh token and returns the payload.

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify(token, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  // Refresh the access token using a valid refresh token.
  async refreshTokens(userId: string, refreshToken: string) {
    // 1. Find the user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Verify the refresh token matches the stored hash
    const isRefreshTokenValid = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new ForbiddenException('Access denied');
    }

    // 3. Generate a new token pair and rotate the refresh token
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  // Generate an access token (short-lived) and a refresh token (long-lived).
  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_EXPIRATION',
          '15m',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // Hash and store the refresh token in the database.
  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hashedToken = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }
}
