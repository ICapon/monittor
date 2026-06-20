import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { CommandsModule } from '../commands/commands.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [AuthModule, CommandsModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'matrix', method: RequestMethod.GET });
  }
}
