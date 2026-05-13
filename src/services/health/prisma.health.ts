import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from 'src/services/prisma.service';

/**
 * Custom Terminus health indicator for the Prisma/SQLite database.
 * Executes a lightweight `SELECT 1` query to verify the database connection.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * @param key - The key to use in the health check result (e.g., 'database').
   * @returns HealthIndicatorResult with status 'up' or throws HealthCheckError.
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        `${key} health check failed`,
        this.getStatus(key, false, { message: (error as Error).message }),
      );
    }
  }
}
