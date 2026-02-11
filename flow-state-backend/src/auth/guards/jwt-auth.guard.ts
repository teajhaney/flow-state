import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Global JWT Authentication Guard.
 *
 * This guard is registered globally via APP_GUARD in AppModule.
 * Every route is protected by default. Routes decorated with
 * @Public() will bypass JWT validation.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If public, skip JWT validation
    if (isPublic) {
      return true;
    }

    // Otherwise, run the default JWT passport validation
    return super.canActivate(context);
  }
}
