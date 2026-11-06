import { Inject, Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import type { AppLogger } from "@makemymarrige/logger";
import { resolveRequestId } from "@makemymarrige/observability";

export const APP_LOGGER = Symbol("APP_LOGGER");

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(@Inject(APP_LOGGER) private readonly logger: AppLogger) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = resolveRequestId(request.header("x-request-id"));
    response.setHeader("x-request-id", requestId);
    const startedAt = Date.now();
    response.on("finish", () => {
      this.logger.info(
        {
          requestId,
          method: request.method,
          path: request.path,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        },
        "http_request",
      );
    });
    next();
  }
}
