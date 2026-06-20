import { Controller, Get, Header, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { HomeService } from './home.service';

const CURRENT_USER_MARKER = '/*__CURRENT_USER__*/ null';

@Controller()
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getIntro(@Req() req: Request): string {
    this.homeService.logVisit(req);
    return this.renderTemplate('intro.html');
  }

  @Get('matrix')
  @Header('Content-Type', 'text/html')
  getMatrix(@Req() req: Request): string {
    this.homeService.logVisit(req);
    return this.renderTemplate('matrix.html');
  }

  @Get('terminal')
  @Header('Content-Type', 'text/html')
  getTerminal(@Req() req: Request): string {
    this.homeService.logVisit(req);
    const html = this.renderTemplate('terminal.html');
    const username = this.getCurrentUsername(req);
    return html.replace(
      CURRENT_USER_MARKER,
      '/*__CURRENT_USER__*/ ' + toScriptSafeJson(username),
    );
  }

  // No middleware here on purpose: /terminal stays open to everyone, this
  // just personalizes the prompt when a valid session cookie happens to be
  // present — anonymous visitors fall through to null with no error.
  private getCurrentUsername(req: Request): string | null {
    const cookieName = this.configService.get<string>('authCookie.name')!;
    const token = req.cookies?.[cookieName];
    return this.authService.verifyToken(token)?.username ?? null;
  }

  private renderTemplate(name: string): string {
    return readFileSync(join(__dirname, 'templates', name), 'utf8');
  }
}

// Escapes "<" so a username containing "</script>" can't break out of the
// inline <script> block it gets embedded into (JSON.stringify alone does
// not escape angle brackets).
function toScriptSafeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
