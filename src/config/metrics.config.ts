import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

/**
 * Token constants for metric injection.
 * These tokens are used with @InjectMetric() to get the metric instance.
 */
export const METRICS = {
  HTTP_REQUEST_DURATION: 'http_request_duration_seconds',
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_SIZE: 'http_request_size_bytes',
  HTTP_RESPONSE_SIZE: 'http_response_size_bytes',
} as const;

/**
 * Duration buckets in seconds — covers fast API calls (5ms)
 * through slow operations (10s).
 */
const DURATION_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];

/**
 * Size buckets in bytes — covers tiny responses (100B)
 * through large payloads (10MB).
 */
const SIZE_BUCKETS = [100, 1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000, 10_000_000];

/**
 * HTTP request duration histogram.
 * Measures how long each request takes to complete.
 */
export const httpRequestDurationProvider = makeHistogramProvider({
  name: METRICS.HTTP_REQUEST_DURATION,
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: DURATION_BUCKETS,
});

/**
 * HTTP request counter.
 * Counts total number of HTTP requests by method, route, and status code.
 */
export const httpRequestsTotalProvider = makeCounterProvider({
  name: METRICS.HTTP_REQUESTS_TOTAL,
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

/**
 * HTTP request size histogram.
 * Measures the size of incoming request payloads.
 */
export const httpRequestSizeProvider = makeHistogramProvider({
  name: METRICS.HTTP_REQUEST_SIZE,
  help: 'Size of HTTP request payloads in bytes',
  labelNames: ['method', 'route'],
  buckets: SIZE_BUCKETS,
});

/**
 * HTTP response size histogram.
 * Measures the size of outgoing response payloads.
 */
export const httpResponseSizeProvider = makeHistogramProvider({
  name: METRICS.HTTP_RESPONSE_SIZE,
  help: 'Size of HTTP response payloads in bytes',
  labelNames: ['method', 'route'],
  buckets: SIZE_BUCKETS,
});
