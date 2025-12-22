import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable, catchError, throwError, tap } from 'rxjs';
import { ResponseInterface } from '../interfaces/response.interface';
import { Request } from 'express';

@Injectable()
export class TransFormInterceptor<T> implements NestInterceptor<
  T,
  ResponseInterface<T>
> {
  private readonly logger = new Logger(TransFormInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseInterface<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.debug(`[${method}] ${url} completed in ${duration}ms`);
      }),
      map((data) => {
        return {
          data,
          success: true,
          timestamp: new Date().toISOString(),
        };
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `[${method}] ${url} failed after ${duration}ms`,
          error.stack,
        );
        return throwError(() => error);
      }),
    );
  }
}
