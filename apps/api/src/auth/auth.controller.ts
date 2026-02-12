import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';
import { GoogleAuthGuard } from './google-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(GoogleAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
