import { MiddlewareConsumer, Module, type DynamicModule, type NestModule } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { createLogger } from "@makemymarrige/logger";
import type { ApiEnvironment } from "./config.js";
import { DatabaseModule } from "./database/database.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health/health.controller.js";
import { HttpExceptionEnvelopeFilter } from "./common/http-exception.filter.js";
import { APP_LOGGER, RequestLoggingMiddleware } from "./common/request-logging.middleware.js";

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }

  static register(environment: ApiEnvironment): DynamicModule {
    const logger = createLogger("makemymarrige-api", environment.LOG_LEVEL);
    return {
      module: AppModule,
      imports: [DatabaseModule.register(environment.MONGODB_URI, logger), AuthModule.register(environment)],
      controllers: [HealthController],
      providers: [
        { provide: APP_LOGGER, useValue: logger },
        { provide: APP_FILTER, useClass: HttpExceptionEnvelopeFilter },
        RequestLoggingMiddleware,
      ],
    };
  }
}
