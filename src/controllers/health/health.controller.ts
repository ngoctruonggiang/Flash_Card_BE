import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from 'src/services/health/prisma.health';
import { RouteConfig } from 'src/utils/decorators/route.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  /**
   * GET /api/health
   * Returns the overall health status including database, memory, and disk.
   * This endpoint is public (no auth required) for uptime monitoring tools.
   */
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Health check failed' })
  @RouteConfig({
    message: 'Health check',
    requiresAuth: false,
  })
  check() {
    return this.health.check([
      // Database: Verify Prisma can execute a query
      () => this.prismaHealth.isHealthy('database'),

      // Memory: Heap should not exceed 256MB
      () => this.memory.checkHeap('memory_heap', 256 * 1024 * 1024),

      // Memory: RSS should not exceed 512MB
      () => this.memory.checkRSS('memory_rss', 512 * 1024 * 1024),

      // Disk: Storage should have at least 10% free space
      () =>
        this.disk.checkStorage('disk', {
          thresholdPercent: 0.9,
          path: process.cwd(),
        }),
    ]);
  }

  /**
   * GET /api/health/liveness
   * Lightweight liveness probe — just confirms the process is running.
   */
  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @RouteConfig({
    message: 'Liveness probe',
    requiresAuth: false,
  })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
