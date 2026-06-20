import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export class ListVisitsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  // Query strings only ever carry "true"/"false" as text — Boolean("false")
  // would otherwise come out true, so this is converted explicitly rather
  // than relying on @Type(() => Boolean).
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  desc?: boolean = true;

  // Date-only on purpose (no time-of-day) — matches what was asked for.
  @IsOptional()
  @Matches(DATE_ONLY, { message: 'startDate must be in YYYY-MM-DD format' })
  startDate?: string;

  @IsOptional()
  @Matches(DATE_ONLY, { message: 'endDate must be in YYYY-MM-DD format' })
  endDate?: string;
}
