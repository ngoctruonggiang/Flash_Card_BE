import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

export interface RouteConfig {
  message: string;
  version?: string;
  requiresAuth?: boolean;
  roles?: Role[];
}

export const RouteConfig = Reflector.createDecorator<RouteConfig>();
