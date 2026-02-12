import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { GoogleAuthService } from './google-auth.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class GoogleAuthGuard implements CanActivate {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const idToken = authHeader.slice('Bearer '.length).trim();

    if (!idToken) {
      throw new UnauthorizedException('Missing token value');
    }

    request.user = await this.googleAuthService.authenticateIdToken(idToken);

    return true;
  }
}
