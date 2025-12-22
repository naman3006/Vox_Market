import { Injectable, Logger, LogLevel } from '@nestjs/common';

export interface LogContext {
  userId?: string;
  requestId?: string;
  module?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService extends Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  error(message: any, trace?: string, context?: string | LogContext): void {
    const contextObj: LogContext | undefined =
      typeof context === 'string' ? { module: context } : context;
    const contextStr = contextObj ? JSON.stringify(contextObj) : '';
    const logMessage = `${message} ${contextStr}`.trim();
    super.error(logMessage, trace, contextObj?.module);

    if (this.isProduction) {
      this.sendToExternalLogger('error', logMessage, trace, contextObj);
    }
  }

  warn(message: any, context?: string | LogContext): void {
    const contextObj: LogContext | undefined =
      typeof context === 'string' ? { module: context } : context;
    const contextStr = contextObj ? JSON.stringify(contextObj) : '';
    const logMessage = `${message} ${contextStr}`.trim();
    super.warn(logMessage, contextObj?.module);
  }

  log(message: any, context?: string | LogContext): void {
    const contextObj: LogContext | undefined =
      typeof context === 'string' ? { module: context } : context;
    const contextStr = contextObj ? JSON.stringify(contextObj) : '';
    const logMessage = `${message} ${contextStr}`.trim();
    super.log(logMessage, contextObj?.module);
  }

  debug(message: any, context?: string | LogContext): void {
    if (!this.isProduction) {
      const contextObj: LogContext | undefined =
        typeof context === 'string' ? { module: context } : context;
      const contextStr = contextObj ? JSON.stringify(contextObj) : '';
      const logMessage = `${message} ${contextStr}`.trim();
      super.debug(logMessage, contextObj?.module);
    }
  }

  private sendToExternalLogger(
    level: LogLevel,
    message: string,
    trace?: string,
    context?: LogContext,
  ): void {
    // Implement external logger integration (e.g., Sentry, DataDog, etc.)
    // Example:
    // sentryClient.captureException(new Error(message), {
    //   level,
    //   extra: { trace, ...context },
    // });
  }

  logApiCall(
    method: string,
    url: string,
    status: number,
    duration: number,
  ): void {
    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
    this[logLevel](`[${method}] ${url} - ${status} - ${duration}ms`);
  }
}
