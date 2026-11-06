import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { AppLogger } from "@makemymarrige/logger";
import { APP_LOGGER } from "./request-logging.middleware.js";

type ErrorResponse = {
  error: { code: string; message: string };
  meta: { requestId: string | null };
};

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  constructor(@Inject(APP_LOGGER) private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const requestId = response.getHeader("x-request-id");
    const body: ErrorResponse = {
      error: {
        code: status === 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR",
        message:
          status === 500 ? "An unexpected error occurred." : "The request could not be completed.",
      },
      meta: { requestId: typeof requestId === "string" ? requestId : null },
    };

    if (status === 500) {
      this.logger.error({ path: request.path, method: request.method }, "unhandled_exception");
    }
    response.status(status).json(body);
  }
}
