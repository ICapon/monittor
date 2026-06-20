import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Visit } from './entities/visit.entity';
import { VisitsService } from './visits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Visit])],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
