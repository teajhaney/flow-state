import { Controller, Get, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/types/auth-types';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users/me - Returns the authenticated user's profile
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.userService.findById(user.userId);
  }
}
