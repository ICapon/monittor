import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VisitorInfo } from '../home/home.service';
import { Visit } from './entities/visit.entity';

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit) private readonly visitsRepository: Repository<Visit>,
  ) {}

  // Upsert by visitorId — one row per browser, not one per page view.
  // userId is only ever set, never cleared: once a visitorId is linked to
  // an account, later anonymous hits from the same cookie keep the link.
  async recordVisit(
    visitorId: string,
    info: VisitorInfo,
    path: string,
    userId: string | null,
  ): Promise<void> {
    const existing = await this.visitsRepository.findOne({ where: { visitorId } });

    if (existing) {
      Object.assign(existing, info, {
        lastPath: path,
        visitCount: existing.visitCount + 1,
        userId: userId ?? existing.userId,
      });
      await this.visitsRepository.save(existing);
      return;
    }

    const visit = this.visitsRepository.create({
      visitorId,
      ...info,
      lastPath: path,
      userId,
      visitCount: 1,
    });
    await this.visitsRepository.save(visit);
  }
}
