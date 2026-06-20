import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { lookup } from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export interface VisitorInfo {
  ip: string;
  location: string;
  browser: string;
  engine: string;
  os: string;
  device: string;
  language: string;
  referer: string;
  userAgent: string;
}

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  logVisit(req: Request): void {
    const info = this.getVisitorInfo(req);

    this.logger.log(
      [
        '',
        '┌─ NEW VISITOR ─────────────────────────────',
        `│ time:       ${new Date().toISOString()}`,
        `│ ip:         ${info.ip}`,
        `│ location:   ${info.location}`,
        `│ browser:    ${info.browser}`,
        `│ engine:     ${info.engine}`,
        `│ os:         ${info.os}`,
        `│ device:     ${info.device}`,
        `│ language:   ${info.language}`,
        `│ referer:    ${info.referer}`,
        `│ user-agent: ${info.userAgent}`,
        '└────────────────────────────────────────────',
      ].join('\n'),
    );
  }

  // Same data as logVisit's console block, returned as a plain object —
  // used by GET /whoami to answer "who/where am I" for the terminal.
  getVisitorInfo(req: Request): VisitorInfo {
    const ip = this.extractIp(req);
    const geo = lookup(ip);
    const { browser, os, engine, device } = UAParser(req.headers['user-agent'] ?? '');

    const location = geo
      ? `${geo.city || 'unknown city'}, ${geo.region}, ${geo.country} (${geo.ll.join(', ')}) [${geo.timezone}]`
      : 'unknown (private/local IP)';

    return {
      ip,
      location,
      browser: `${browser.name ?? 'unknown'} ${browser.version ?? ''}`.trim(),
      engine: `${engine.name ?? 'unknown'} ${engine.version ?? ''}`.trim(),
      os: `${os.name ?? 'unknown'} ${os.version ?? ''}`.trim(),
      device:
        `${[device.vendor, device.model].filter(Boolean).join(' ') || 'desktop'} (${device.type ?? 'desktop'})`,
      language: (req.headers['accept-language'] as string) ?? 'unknown',
      referer: (req.headers['referer'] as string) ?? 'direct',
      userAgent: req.headers['user-agent'] ?? 'unknown',
    };
  }

  private extractIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }
}
