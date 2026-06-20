import { Controller, ForbiddenException, Get, Header, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Request } from 'express';
import { AuthService, JwtPayload } from '../auth/auth.service';
import { CommandsService } from '../commands/commands.service';
import { HomeService, VisitorInfo } from './home.service';

const CURRENT_USER_MARKER = '/*__CURRENT_USER__*/ null';
const CURRENT_COMMANDS_MARKER = '/*__CURRENT_COMMANDS__*/ []';

@Controller()
export class HomeController {
  constructor(
    private readonly homeService: HomeService,
    private readonly authService: AuthService,
    private readonly commandsService: CommandsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getIntro(): string {
    return this.renderTemplate('intro.html');
  }

  @Get('matrix')
  @Header('Content-Type', 'text/html')
  getMatrix(): string {
    return this.renderTemplate('matrix.html');
  }

  @Get('terminal')
  @Header('Content-Type', 'text/html')
  async getTerminal(@Req() req: Request): Promise<string> {
    const session = this.getSession(req);
    const commands = session
      ? await this.commandsService.findAccessibleCommandsForUser(session.sub)
      : [];

    let html = this.renderTemplate('terminal.html');
    html = html.replace(
      CURRENT_USER_MARKER,
      '/*__CURRENT_USER__*/ ' + toScriptSafeJson(session?.username ?? null),
    );
    html = html.replace(
      CURRENT_COMMANDS_MARKER,
      '/*__CURRENT_COMMANDS__*/ ' + toScriptSafeJson(commands),
    );
    return html;
  }

  // Dynamic response for the "whoami" granted command — unlike the generic
  // fixed-response commands, this reflects the actual current request
  // (IP/geo/UA), so it has to be a real endpoint rather than a cached
  // string handed out at login. Still gated by the same grant check.
  @Get('whoami')
  async whoami(@Req() req: Request): Promise<VisitorInfo> {
    const session = this.getSession(req);
    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    const granted = await this.commandsService.findAccessibleCommandsForUser(session.sub);
    if (!granted.some((command) => command.name === 'whoami')) {
      throw new ForbiddenException('You do not have permission to run whoami.');
    }

    return this.homeService.getVisitorInfo(req);
  }

  // No middleware here on purpose: /terminal stays open to everyone, this
  // just personalizes the prompt/command list when a valid session cookie
  // happens to be present — anonymous visitors fall through to null/[].
  private getSession(req: Request): JwtPayload | null {
    const cookieName = this.configService.get<string>('authCookie.name')!;
    const token = req.cookies?.[cookieName];
    return this.authService.verifyToken(token);
  }

  private renderTemplate(name: string): string {
    return readFileSync(join(__dirname, 'templates', name), 'utf8');
  }
}

// Escapes "<" so a username/response containing "</script>" can't break out
// of the inline <script> block it gets embedded into (JSON.stringify alone
// does not escape angle brackets).
function toScriptSafeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
