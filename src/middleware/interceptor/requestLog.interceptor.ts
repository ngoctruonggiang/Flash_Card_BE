// Source - https://stackoverflow.com/a
// Posted by hojin
// Retrieved 2025-11-26, License - CC BY-SA 4.0

import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method } = request;
    const userAgent = request.get('user-agent') || '';
    const url = request.originalUrl || request.url;
    const startTime = Date.now();

    // Log request completion when the response finishes
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || '0';
      const duration = Date.now() - startTime;

      const logMessage =
        `${method} ${url} ${statusCode} - ${contentLength}b ${duration}ms - ${userAgent} ${ip}`;

      // Use appropriate log level based on status code
      if (statusCode >= 500) {
        this.logger.error(logMessage, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, 'HTTP');
      } else {
        this.logger.log(logMessage, 'HTTP');
      }
    });

    next();
  }
}
