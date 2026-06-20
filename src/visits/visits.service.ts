import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { VisitorInfo } from '../home/home.service';
import { Visit } from './entities/visit.entity';

export interface ListVisitsParams {
  limit: number;
  offset: number;
  desc: boolean;
  startDate?: string;
  endDate?: string;
}

export interface ListVisitsResult {
  items: Visit[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class VisitsService {
  constructor(
    @InjectRepository(Visit) private readonly visitsRepository: Repository<Visit>,
  ) {}

  // Upsert by visitorId — one row per browser, not one per page view.
  // userId is only ever set, never cleared: once a visitorId is linked to
  // an account, later anonymous hits from the same cookie keep the link.
  // Same for metadata (query params, e.g. utm_source/ref): merged in, never
  // wiped out by a later visit that happens to carry none.
  async recordVisit(
    visitorId: string,
    info: VisitorInfo,
    path: string,
    userId: string | null,
    queryParams: Record<string, unknown>,
  ): Promise<void> {
    const existing = await this.visitsRepository.findOne({ where: { visitorId } });
    const hasNewParams = Object.keys(queryParams).length > 0;

    if (existing) {
      Object.assign(existing, info, {
        lastPath: path,
        visitCount: existing.visitCount + 1,
        userId: userId ?? existing.userId,
        metadata: hasNewParams ? { ...existing.metadata, ...queryParams } : existing.metadata,
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
      metadata: hasNewParams ? queryParams : null,
    });
    await this.visitsRepository.save(visit);
  }

  // Filtered/sorted by updatedAt ("last seen") rather than createdAt —
  // since a row is one-per-visitor and gets touched on every return visit,
  // this reflects recent activity rather than just first-time arrivals.
  async findVisits(params: ListVisitsParams): Promise<ListVisitsResult> {
    const updatedAt = this.buildDateRangeFilter(params.startDate, params.endDate);

    const [items, total] = await this.visitsRepository.findAndCount({
      where: updatedAt ? { updatedAt } : {},
      order: { updatedAt: params.desc ? 'DESC' : 'ASC' },
      take: params.limit,
      skip: params.offset,
    });

    return { items, total, limit: params.limit, offset: params.offset };
  }

  private buildDateRangeFilter(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;

    const start = startDate ? this.parseDateBoundary(startDate, 'start') : undefined;
    const end = endDate ? this.parseDateBoundary(endDate, 'end') : undefined;

    if (start && end) return Between(start, end);
    if (start) return MoreThanOrEqual(start);
    return LessThanOrEqual(end!);
  }

  // startDate covers from 00:00:00.000 that day; endDate covers through
  // 23:59:59.999 that day, so passing the same date for both includes the
  // whole day rather than excluding everything past midnight.
  private parseDateBoundary(value: string, edge: 'start' | 'end'): Date {
    const date = new Date(`${value}T${edge === 'start' ? '00:00:00.000' : '23:59:59.999'}Z`);
    // new Date() silently rolls invalid calendar days over to the next
    // valid date (e.g. "2026-02-30" becomes March 2) instead of failing —
    // re-deriving the date portion and comparing catches that case too.
    const isRealDate = !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    if (!isRealDate) {
      throw new BadRequestException(`${edge === 'start' ? 'startDate' : 'endDate'} is not a valid date`);
    }
    return date;
  }
}
