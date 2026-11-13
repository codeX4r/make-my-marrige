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

    let code = status === 500 ? "INTERNAL_SERVER_ERROR" : "HTTP_ERROR";
    let message =
      status === 500 ? "An unexpected error occurred." : "The request could not be completed.";

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === "object" && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        if (typeof resObj.message === "string") {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          message = resObj.message.join(", ");
        }
        if (typeof resObj.code === "string") {
          code = resObj.code;
        } else if (typeof resObj.error === "string") {
          code = resObj.error.toUpperCase().replace(/\s+/g, "_");
        }
      }
    }

    const body: ErrorResponse = {
      error: { code, message },
      meta: { requestId: typeof requestId === "string" ? requestId : null },
    };

    if (status === 500) {
      this.logger.error(
        {
          path: request.path,
          method: request.method,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        "unhandled_exception",
      );
    } else {
      this.logger.warn(
        {
          path: request.path,
          method: request.method,
          status,
          exception: exception instanceof Error ? exception.message : String(exception),
        },
        "http_exception",
      );
    }
    response.status(status).json(body);
  }
}
