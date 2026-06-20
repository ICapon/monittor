import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { AuthService, JwtPayload } from '../auth.service';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    const cookieName = this.configService.get<string>('authCookie.name')!;
    const token = req.cookies?.[cookieName];
    const payload = this.authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException(
        token ? 'Invalid or expired session' : 'Authentication required',
      );
    }

    req.user = payload;
    next();
  }
}
