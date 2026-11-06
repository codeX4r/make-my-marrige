import type { LoggerService } from "@nestjs/common";
import type { AppLogger } from "@makemymarrige/logger";

export class NestPinoLogger implements LoggerService {
  constructor(private readonly logger: AppLogger) {}

  log(message: unknown, context?: string): void {
    this.logger.info({ context }, String(message));
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.logger.error({ context, stack }, String(message));
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn({ context }, String(message));
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug({ context }, String(message));
  }

  verbose(message: unknown, context?: string): void {
    this.logger.trace({ context }, String(message));
  }
}
