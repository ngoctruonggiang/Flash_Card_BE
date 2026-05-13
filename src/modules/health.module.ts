import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from 'src/controllers/health/health.controller';
import { PrismaModule } from './prisma.module';
import { PrismaHealthIndicator } from 'src/services/health/prisma.health';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
