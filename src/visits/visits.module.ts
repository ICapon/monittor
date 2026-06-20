import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CommandsModule } from '../commands/commands.module';
import { Visit } from './entities/visit.entity';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Visit]), AuthModule, CommandsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule implements NestModule {
  // No circular-dependency concern here (unlike UsersModule): AuthModule
  // does not depend on VisitsModule, so VisitsModule can safely import it
  // and apply AuthMiddleware directly, instead of routing through AppModule.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: 'visits', method: RequestMethod.GET });
  }
}
