import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter<
  T extends Error = Error,
> implements ExceptionFilter<T> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: T, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (typeof message === 'object' && message !== null && !Array.isArray(message)) {
      // If the response is an object with a message property (NestJS default), use that.
      // Otherwise, use the whole object or a default.
      const msg = (message as any).message; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (msg) {
        message = msg;
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      path: request.url,
      method: request.method,
      success: false,
      ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
    };

    // Log error with context
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      exception instanceof HttpException ? exception.message : exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}
