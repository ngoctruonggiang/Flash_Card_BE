// Source - https://stackoverflow.com/a
// Posted by hojin
// Retrieved 2025-11-26, License - CC BY-SA 4.0

import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Request, Response, NextFunction } from 'express';
import type { Counter, Histogram } from 'prom-client';
import { METRICS } from 'src/config/metrics.config';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectMetric(METRICS.HTTP_REQUEST_DURATION)
    private readonly httpRequestDuration: Histogram,
    @InjectMetric(METRICS.HTTP_REQUESTS_TOTAL)
    private readonly httpRequestsTotal: Counter,
    @InjectMetric(METRICS.HTTP_REQUEST_SIZE)
    private readonly httpRequestSize: Histogram,
    @InjectMetric(METRICS.HTTP_RESPONSE_SIZE)
    private readonly httpResponseSize: Histogram,
  ) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method } = request;
    const userAgent = request.get('user-agent') || '';
    const url = request.originalUrl || request.url;
    const startTime = Date.now();

    // Observe request size
    const requestSize = parseInt(request.get('content-length') || '0', 10);

    // Log request completion when the response finishes
    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length') || '0';
      const duration = Date.now() - startTime;
      const durationInSeconds = duration / 1000;

      // Normalize route to avoid high-cardinality labels.
      // Use the Express matched route pattern (e.g., "/api/deck/:id")
      // instead of the actual URL (e.g., "/api/deck/123").
      const route = (request.route as { path?: string })?.path
        ? `${request.baseUrl}${(request.route as { path: string }).path}`
        : url;

      // --- Prometheus Metrics ---
      const labels = { method, route, status_code: String(statusCode) };

      this.httpRequestDuration.observe(labels, durationInSeconds);
      this.httpRequestsTotal.inc(labels);

      if (requestSize > 0) {
        this.httpRequestSize.observe({ method, route }, requestSize);
      }

      const responseSize = parseInt(contentLength, 10);
      if (responseSize > 0) {
        this.httpResponseSize.observe({ method, route }, responseSize);
      }

      // --- Structured Logging ---
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
