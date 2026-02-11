/**
 * JWT token payload shape.
 */
export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * Interface for a user object as attached to the Request by Passport.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}
