import { ArgumentsHost, Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Request, Response } from 'express';

// Browser navigation (typing /matrix, clicking a link) gets the themed
// 401 page; everything else (terminal.html's fetch() calls to /auth/*,
// /whoami, /users) keeps getting the plain JSON error it already parses.
// A bare fetch() defaults to "Accept: */*", which does not contain
// "text/html", so this distinguishes the two reliably without needing a
// special header from the client.
@Catch(UnauthorizedException)
export class UnauthorizedFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (!req.headers.accept?.includes('text/html')) {
      res.status(status).json(exception.getResponse());
      return;
    }

    const html = readFileSync(
      join(__dirname, '..', '..', 'home', 'templates', 'unauthorized.html'),
      'utf8',
    );
    res.status(status).type('html').send(html);
  }
}
