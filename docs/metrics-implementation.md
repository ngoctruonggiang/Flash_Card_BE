# Prometheus Metrics System — Implementation Documentation

## Overview

This document explains all changes made to implement a **Prometheus metrics system** in the FlashLearn backend. The system collects HTTP request metrics (duration, count, payload sizes) and default Node.js process metrics (CPU, memory, GC, event loop), exposing them at `GET /api/metrics` in Prometheus text format.

---

## Dependencies Added

```bash
npm install @willsoto/nestjs-prometheus prom-client
```

| Package | Version | Purpose |
|---|---|---|
| `@willsoto/nestjs-prometheus` | ^6.x | NestJS module that integrates `prom-client` with NestJS DI and exposes a `/metrics` endpoint via a built-in `PrometheusController` |
| `prom-client` | ^15.x | The official Prometheus client library for Node.js. Provides Counter, Histogram, Gauge, Summary metric types and default Node.js process metrics |

---

## Files Created

### 1. `src/config/metrics.config.ts` — Custom Metric Definitions

This file defines four custom HTTP metrics using `@willsoto/nestjs-prometheus` helper functions:

```
┌──────────────────────────────────────────────────────────────┐
│                    metrics.config.ts                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ http_request_duration_seconds (Histogram)           │     │
│  │ Labels: method, route, status_code                  │     │
│  │ Buckets: 5ms → 10s                                  │     │
│  │ Purpose: How long each request takes                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ http_requests_total (Counter)                       │     │
│  │ Labels: method, route, status_code                  │     │
│  │ Purpose: Total count of requests                    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ http_request_size_bytes (Histogram)                 │     │
│  │ Labels: method, route                               │     │
│  │ Buckets: 100B → 10MB                                │     │
│  │ Purpose: Size of incoming request payloads          │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ http_response_size_bytes (Histogram)                │     │
│  │ Labels: method, route                               │     │
│  │ Buckets: 100B → 10MB                                │     │
│  │ Purpose: Size of outgoing response payloads         │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- **`makeHistogramProvider()` / `makeCounterProvider()`**: These are factory functions from `@willsoto/nestjs-prometheus` that create NestJS providers. They allow metrics to be injected via `@InjectMetric()` decorator anywhere in the app.
- **Duration buckets** `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]`: Cover fast API calls (5ms) through slow operations (10s). These match Prometheus conventions.
- **Size buckets** `[100, 1000, 5000, ..., 10000000]`: Cover tiny responses (100B) through large payloads (10MB).
- **`METRICS` constant object**: Provides a single source of truth for metric name strings, preventing typos when injecting metrics.

### 2. `src/modules/metrics.module.ts` — Metrics Module

This module wires everything together:

```typescript
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',        // → becomes /api/metrics with global prefix
      defaultMetrics: {
        enabled: true,         // Collects CPU, memory, GC, event loop metrics
      },
    }),
  ],
  providers: [/* all 4 custom metric providers */],
  exports: [/* all 4 custom metric providers */],
})
export class MetricsModule {}
```

**Why `exports` is needed**: The `RequestLoggerMiddleware` lives in `AppModule`, not in `MetricsModule`. By exporting the metric providers, they become available for injection anywhere that imports `MetricsModule`.

**Why `defaultMetrics.enabled: true`**: This automatically collects ~20 Node.js process metrics without any additional code:
- `process_cpu_user_seconds_total` / `process_cpu_system_seconds_total`
- `nodejs_heap_size_total_bytes` / `nodejs_heap_size_used_bytes`
- `nodejs_eventloop_lag_seconds` / `nodejs_eventloop_lag_p99_seconds`
- `nodejs_gc_duration_seconds` (by GC kind)
- `nodejs_active_handles_total` / `nodejs_active_requests_total`
- `nodejs_version_info`

---

## Files Modified

### 3. `src/app.module.ts` — Added MetricsModule Import

```diff
 import { HealthModule } from './modules/health.module';
+import { MetricsModule } from './modules/metrics.module';

 @Module({
   imports: [
     ...
     HealthModule,
+    MetricsModule,
     ScheduleModule.forRoot(),
   ],
```

**Why here**: `AppModule` is where the `RequestLoggerMiddleware` is registered. By importing `MetricsModule` here, the middleware can inject the exported metric providers.

### 4. `src/middleware/interceptor/requestLog.interceptor.ts` — Metric Recording

The middleware was enhanced to inject and record all four Prometheus metrics alongside the existing Winston logging:

```diff
+import { InjectMetric } from '@willsoto/nestjs-prometheus';
+import type { Counter, Histogram } from 'prom-client';
+import { METRICS } from 'src/config/metrics.config';

 export class RequestLoggerMiddleware implements NestMiddleware {
   constructor(
     @Inject(WINSTON_MODULE_NEST_PROVIDER)
     private readonly logger: LoggerService,
+    @InjectMetric(METRICS.HTTP_REQUEST_DURATION)
+    private readonly httpRequestDuration: Histogram,
+    @InjectMetric(METRICS.HTTP_REQUESTS_TOTAL)
+    private readonly httpRequestsTotal: Counter,
+    @InjectMetric(METRICS.HTTP_REQUEST_SIZE)
+    private readonly httpRequestSize: Histogram,
+    @InjectMetric(METRICS.HTTP_RESPONSE_SIZE)
+    private readonly httpResponseSize: Histogram,
   ) {}
```

**Inside the `response.on('finish')` callback**, the following metric operations were added:

```typescript
// Normalize route to avoid high-cardinality labels
const route = request.route?.path
  ? `${request.baseUrl}${request.route.path}`  // e.g., "/api/deck/:id"
  : url;                                        // fallback to raw URL

// Record metrics
this.httpRequestDuration.observe(labels, durationInSeconds);
this.httpRequestsTotal.inc(labels);
this.httpRequestSize.observe({ method, route }, requestSize);
this.httpResponseSize.observe({ method, route }, responseSize);
```

**Critical: Route normalization for label cardinality**

Without normalization, every unique URL creates a new time series:
```
# BAD — creates infinite series
http_requests_total{route="/api/deck/1"} 1
http_requests_total{route="/api/deck/2"} 1
http_requests_total{route="/api/deck/3"} 1
... thousands more
```

With normalization using `request.route.path`:
```
# GOOD — single series for the pattern
http_requests_total{route="/api/deck/:id"} 3
```

**Why `import type { Counter, Histogram }`**: The project uses `isolatedModules: true` in `tsconfig.json`. Since `Counter` and `Histogram` are only used as type annotations (not runtime values), they must use `import type` to avoid TypeScript compilation errors.

### 5. `.env.sample` — Added NODE_ENV

```diff
+NODE_ENV=development
+
 PORT=3000
```

**Why**: CI runs `cp .env.sample .env`. Without `NODE_ENV`, the Winston logger config defaults to production JSON format, which could cause unexpected behavior during CI test runs.

---

## Authentication Bypass

The `/api/metrics` endpoint is automatically public — **no code changes were needed** in the `AuthGuard`. Here's why:

```typescript
// auth.guard.ts, line 27-28
const routeConfig = this.reflector.get(RouteConfig, context.getHandler());
if (!routeConfig?.requiresAuth) return true;  // ← allows access
```

The `PrometheusController` (from the library) doesn't have our `@RouteConfig` decorator, so `routeConfig` is `undefined`. The optional chain `?.requiresAuth` evaluates to `undefined`, which is falsy, so the guard returns `true` and allows access.

---

## How Data Flows

```
Client Request
     │
     ▼
┌─────────────────────────────────┐
│   RequestLoggerMiddleware       │
│                                 │
│   ① Records startTime           │
│   ② Reads request content-length│
│   ③ Attaches 'finish' listener  │
│   ④ Calls next()                │
└──────────────┬──────────────────┘
               │
               ▼
       Guards → Controller → Service → Database
               │
               ▼
         Response sent
               │
               ▼
┌─────────────────────────────────┐
│   'finish' event fires          │
│                                 │
│   ⑤ Calculate duration          │
│   ⑥ Normalize route pattern     │
│   ⑦ httpRequestDuration.observe()│  ←── Prometheus Histogram
│   ⑧ httpRequestsTotal.inc()     │  ←── Prometheus Counter
│   ⑨ httpRequestSize.observe()   │  ←── Prometheus Histogram
│   ⑩ httpResponseSize.observe()  │  ←── Prometheus Histogram
│   ⑪ logger.log/warn/error()     │  ←── Winston (unchanged)
└─────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  GET /api/metrics               │
│  (PrometheusController)         │
│                                 │
│  Scrapes all registered metrics │
│  Returns Prometheus text format │
└─────────────────────────────────┘
```

---

## Example Metric Output

After hitting `GET /api/health` and `GET /api/health/liveness`, the `/api/metrics` endpoint returns:

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.005",method="GET",route="/api/health/liveness",status_code="200"} 1
http_request_duration_seconds_bucket{le="0.5",method="GET",route="/api/health",status_code="200"} 1
http_request_duration_seconds_sum{method="GET",route="/api/health",status_code="200"} 0.498
http_request_duration_seconds_count{method="GET",route="/api/health",status_code="200"} 1

# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/health",status_code="200"} 1
http_requests_total{method="GET",route="/api/health/liveness",status_code="200"} 1

# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.
# TYPE process_cpu_user_seconds_total counter
process_cpu_user_seconds_total 0.578

# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js in bytes.
# TYPE nodejs_heap_size_used_bytes gauge
nodejs_heap_size_used_bytes 37017480
```

---

## Verification Results

| Check | Result |
|---|---|
| `npx nest build` | ✅ 0 TypeScript errors |
| `npm run test` | ✅ 20 suites, 801 tests passed |
| `GET /api/metrics` (no auth token) | ✅ Returns Prometheus text format |
| Custom metrics populated after requests | ✅ Duration, count, and size recorded |
| Default Node.js metrics | ✅ CPU, memory, GC, event loop collected |
| Route label cardinality | ✅ Uses patterns like `/api/deck/:id` |

---

## File Summary

| File | Action | Purpose |
|---|---|---|
| `src/config/metrics.config.ts` | **Created** | Defines 4 custom Prometheus metrics with labels and buckets |
| `src/modules/metrics.module.ts` | **Created** | Registers PrometheusModule and exports metric providers |
| `src/app.module.ts` | **Modified** | Imports MetricsModule |
| `src/middleware/interceptor/requestLog.interceptor.ts` | **Modified** | Injects and records metrics on every request |
| `.env.sample` | **Modified** | Added NODE_ENV for CI compatibility |
