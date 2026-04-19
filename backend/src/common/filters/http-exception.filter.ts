import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    const message = normalizeMessage(exceptionResponse, exception);
    const details = exceptionResponse && typeof exceptionResponse === "object" ? exceptionResponse : undefined;

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} failed with ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} failed with ${status}: ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      error:
        isHttpException && exceptionResponse && typeof exceptionResponse === "object" && "error" in exceptionResponse
          ? exceptionResponse.error
          : HttpStatus[status] ?? "Error",
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.headers["x-request-id"] ?? null,
      details,
    });
  }
}

function normalizeMessage(exceptionResponse: unknown, exception: unknown) {
  if (exceptionResponse && typeof exceptionResponse === "object" && "message" in exceptionResponse) {
    const responseMessage = exceptionResponse.message;
    if (Array.isArray(responseMessage)) {
      return responseMessage.join(", ");
    }
    if (typeof responseMessage === "string") {
      return responseMessage;
    }
  }

  if (exception instanceof Error) {
    return exception.message;
  }

  return "Internal server error";
}
