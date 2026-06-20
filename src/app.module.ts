import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validate } from './config/env.validation';
import { typeOrmConfig } from './config/database.config';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { HomeModule } from './home/home.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),
    // Global defense-in-depth default; AuthController's login route overrides
    // this with a stricter limit (see auth.controller.ts).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HomeModule,
    UsersModule,
    AuthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  // Registered here (not in UsersModule) to avoid a circular module
  // dependency: AuthModule already imports UsersModule for UsersService,
  // so UsersModule importing AuthModule back for AuthMiddleware would cycle.
  // AppModule sits above both, so it can wire this without that problem.
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: 'users', method: RequestMethod.POST });
  }
}
