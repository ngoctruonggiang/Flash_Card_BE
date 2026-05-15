import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {
  httpRequestDurationProvider,
  httpRequestsTotalProvider,
  httpRequestSizeProvider,
  httpResponseSizeProvider,
} from 'src/config/metrics.config';

/**
 * MetricsModule configures Prometheus metrics collection.
 *
 * - Exposes GET /api/metrics (global prefix 'api' + path 'metrics')
 * - Registers custom HTTP metrics (duration, count, request/response sizes)
 * - Collects default Node.js metrics (CPU, memory, event loop, GC, etc.)
 *
 * The /api/metrics endpoint is automatically public because the AuthGuard
 * allows access when no @RouteConfig decorator is present
 * (line 28: `if (!routeConfig?.requiresAuth) return true;`).
 */
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics', // Becomes /api/metrics with global prefix
      defaultMetrics: {
        enabled: true, // Collect default Node.js process metrics
      },
    }),
  ],
  providers: [
    httpRequestDurationProvider,
    httpRequestsTotalProvider,
    httpRequestSizeProvider,
    httpResponseSizeProvider,
  ],
  exports: [
    httpRequestDurationProvider,
    httpRequestsTotalProvider,
    httpRequestSizeProvider,
    httpResponseSizeProvider,
  ],
})
export class MetricsModule {}
