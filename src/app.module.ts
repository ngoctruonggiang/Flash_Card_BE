import {
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user.module';
import { DeckModule } from './modules/deck.module';
import { CardModule } from './modules/card.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './middleware/interceptor/response.interceptor';
import { GlobalExceptionFilter } from './middleware/filters/global.filter';
import { RolesGuard } from './middleware/guards/roles.guard';
import { AuthGuard } from './middleware/guards/auth.guard';
import { AuthModule } from './modules/auth.module';
import { StudyModule } from './modules/study.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReviewService } from './services/review/review.service';
import { RequestLoggerMiddleware } from './middleware/interceptor/requestLog.interceptor';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { HealthModule } from './modules/health.module';
import { MetricsModule } from './modules/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Register Winston as a NestJS module so @Inject(WINSTON_MODULE_NEST_PROVIDER)
    // works in middleware, filters, and services via DI.
    WinstonModule.forRoot(winstonConfig),
    UserModule,
    DeckModule,
    CardModule,
    AuthModule,
    StudyModule,
    HealthModule,
    MetricsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
