import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload, AuthenticatedUser } from '../types/auth-types';

/**
 * JWT Strategy for Passport.
 *
 * Extracts the JWT from the Authorization Bearer header,
 * validates it using the JWT_SECRET, and attaches the
 * decoded user info to the request object.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'fallback-secret'),
    });
  }

  /**
   * Called after the JWT is verified. The returned object
   * is attached to `request.user`.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
