import { SetMetadata } from '@nestjs/common';

/**
 * Key used to mark routes as publicly accessible.
 * When applied, the JwtAuthGuard will skip JWT validation.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() decorator — marks a route as publicly accessible,
 * bypassing the global JWT authentication guard.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
