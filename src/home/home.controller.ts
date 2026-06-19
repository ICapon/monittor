import { Controller, Get, Header, Req } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Request } from 'express';
import { HomeService } from './home.service';

@Controller()
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  getWelcome(@Req() req: Request): string {
    this.homeService.logVisit(req);
    return readFileSync(
      join(__dirname, 'templates', 'welcome.html'),
      'utf8',
    );
  }
}
