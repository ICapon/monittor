import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Response } from 'express';
import * as ms from 'ms';
import { AccessibleCommand, CommandsService } from '../commands/commands.service';
import { AuthenticatedRequest } from './middleware/auth.middleware';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly commandsService: CommandsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ username: string; commands: AccessibleCommand[] }> {
    const user = await this.authService.validateUser(dto.username, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { token } = this.authService.login(user);
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '1h';

    res.cookie(this.configService.get<string>('authCookie.name')!, token, {
      ...this.getCookieOptions(),
      maxAge: ms(expiresIn as ms.StringValue),
    });

    const commands = await this.commandsService.findAccessibleCommandsForUser(user.id);
    return { username: user.username, commands };
  }

  // Idempotent on purpose: clearing a cookie that was never set (or already
  // expired) is still a "successful" logout from the client's point of view.
  // No middleware/auth check needed here.
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    res.clearCookie(this.configService.get<string>('authCookie.name')!, this.getCookieOptions());
    return { message: 'logged out' };
  }

  // Gated by AuthMiddleware (see auth.module.ts) — req.user is only set if
  // the cookie carried a valid, unexpired JWT.
  @Get('me')
  async me(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ username: string; commands: AccessibleCommand[] }> {
    const commands = await this.commandsService.findAccessibleCommandsForUser(req.user!.sub);
    return { username: req.user!.username, commands };
  }

  // Shared between login (res.cookie) and logout (res.clearCookie) — they
  // must match exactly or the browser won't recognize it as the same cookie
  // to clear.
  private getCookieOptions(): CookieOptions {
    const isProd = this.configService.get<string>('nodeEnv') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      domain: this.configService.get<string>('authCookie.domain'),
      path: '/',
    };
  }
}
