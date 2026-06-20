import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import * as ms from 'ms';
import { AuthService } from '../../auth/auth.service';
import { VisitsService } from '../../visits/visits.service';
import { HomeService } from '../home.service';

const VISITOR_COOKIE_MAX_AGE = '365d';

// Applied globally (see home.module.ts) so every GET page route is tracked
// automatically — no need to call anything from individual controllers.
// Only fires for real browser navigation (Accept: text/html); a bare
// fetch() defaults to "Accept: */*", so API calls (POST /auth/login,
// GET /whoami, etc.) never get counted as a "visit".
@Injectable()
export class VisitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(VisitMiddleware.name);

  constructor(
    private readonly homeService: HomeService,
    private readonly visitsService: VisitsService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.method !== 'GET' || !req.headers.accept?.includes('text/html')) {
      next();
      return;
    }

    try {
      this.homeService.logVisit(req);
      const info = this.homeService.getVisitorInfo(req);
      const visitorId = this.getOrCreateVisitorId(req, res);
      const session = this.authService.verifyToken(this.getAuthToken(req));
      // req.path/req.url are unreliable here: Express strips the matched
      // prefix from them for middleware mounted via forRoutes('*'), so they
      // read as "/" for every request. req.originalUrl is untouched.
      const path = req.originalUrl.split('?')[0];
      await this.visitsService.recordVisit(
        visitorId,
        info,
        path,
        session?.sub ?? null,
        req.query as Record<string, unknown>,
      );
    } catch (error) {
      // Never block the actual page render over a visit-tracking hiccup.
      this.logger.warn(`Failed to record visit: ${(error as Error).message}`);
    }

    next();
  }

  private getOrCreateVisitorId(req: Request, res: Response): string {
    const cookieName = this.configService.get<string>('visitorCookie.name')!;
    const existing = req.cookies?.[cookieName];
    if (existing) return existing;

    const visitorId = randomUUID();
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    res.cookie(cookieName, visitorId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      domain: this.configService.get<string>('visitorCookie.domain'),
      maxAge: ms(VISITOR_COOKIE_MAX_AGE as ms.StringValue),
      path: '/',
    });
    return visitorId;
  }

  private getAuthToken(req: Request): string | undefined {
    const cookieName = this.configService.get<string>('authCookie.name')!;
    return req.cookies?.[cookieName];
  }
}
