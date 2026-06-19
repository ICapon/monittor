import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { lookup } from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  logVisit(req: Request): void {
    const ip = this.extractIp(req);
    const geo = lookup(ip);
    const { browser, os, engine, device } = UAParser(
      req.headers['user-agent'] ?? '',
    );

    const location = geo
      ? `${geo.city || 'unknown city'}, ${geo.region}, ${geo.country} (${geo.ll.join(', ')}) [${geo.timezone}]`
      : 'unknown (private/local IP)';

    this.logger.log(
      [
        '',
        '┌─ NEW VISITOR ─────────────────────────────',
        `│ time:       ${new Date().toISOString()}`,
        `│ ip:         ${ip}`,
        `│ location:   ${location}`,
        `│ browser:    ${browser.name ?? 'unknown'} ${browser.version ?? ''}`,
        `│ engine:     ${engine.name ?? 'unknown'} ${engine.version ?? ''}`,
        `│ os:         ${os.name ?? 'unknown'} ${os.version ?? ''}`,
        `│ device:     ${[device.vendor, device.model].filter(Boolean).join(' ') || 'desktop'} (${device.type ?? 'desktop'})`,
        `│ language:   ${req.headers['accept-language'] ?? 'unknown'}`,
        `│ referer:    ${req.headers['referer'] ?? 'direct'}`,
        `│ user-agent: ${req.headers['user-agent'] ?? 'unknown'}`,
        '└────────────────────────────────────────────',
      ].join('\n'),
    );
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
