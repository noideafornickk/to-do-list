import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';

@Injectable()
export class GoogleAuthService {
  private readonly oauthClient = new OAuth2Client();

  constructor(private readonly prisma: PrismaService) {}

  async authenticateIdToken(idToken: string): Promise<AuthenticatedUser> {
    const audience = process.env.GOOGLE_CLIENT_ID;
    if (!audience) {
      throw new UnauthorizedException('GOOGLE_CLIENT_ID is not configured');
    }

    let ticket;
    try {
      ticket = await this.oauthClient.verifyIdToken({
        idToken,
        audience,
      });
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const user = await this.prisma.user.upsert({
      where: {
        googleSub: payload.sub,
      },
      create: {
        googleSub: payload.sub,
        email: payload.email ?? null,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      },
      update: {
        email: payload.email ?? null,
        name: payload.name ?? null,
        picture: payload.picture ?? null,
      },
      select: {
        id: true,
        googleSub: true,
        email: true,
        name: true,
        picture: true,
      },
    });

    return user;
  }
}
