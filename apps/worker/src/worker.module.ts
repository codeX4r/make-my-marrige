import { DynamicModule, Module } from "@nestjs/common";
import { createLogger } from "@makemymarrige/logger";
import type { WorkerEnvironment } from "./config.js";
import { RedisBullMqBoundary } from "./worker/redis-bullmq.boundary.js";
import { WORKER_LOGGER } from "./worker/tokens.js";

@Module({})
export class WorkerModule {
  static register(environment: WorkerEnvironment): DynamicModule {
    return {
      module: WorkerModule,
      providers: [
        {
          provide: WORKER_LOGGER,
          useValue: createLogger("makemymarrige-worker", environment.LOG_LEVEL),
        },
        { provide: "WORKER_ENVIRONMENT", useValue: environment },
        RedisBullMqBoundary,
      ],
      exports: [RedisBullMqBoundary],
    };
  }
}
