/**
 * Sign Up DTO
 * Data required to register a new user account.
 */
export class SignUpDto {
  email!: string;
  password!: string;
  name?: string;
}
