import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CommandsModule } from '../commands/commands.module';
import { VisitsModule } from '../visits/visits.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { VisitMiddleware } from './middleware/visit.middleware';

@Module({
  imports: [AuthModule, CommandsModule, VisitsModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'matrix', method: RequestMethod.GET });
    // Registered last and globally ('*') — for /matrix this runs only after
    // AuthMiddleware lets the request through, so a blocked/unauthorized
    // attempt still never counts as a visit. Any future GET page route is
    // tracked automatically, no per-route wiring needed.
    consumer.apply(VisitMiddleware).forRoutes('*');
  }
}
