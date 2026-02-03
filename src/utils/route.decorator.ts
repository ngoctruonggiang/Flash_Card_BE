import { applyDecorators, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

export interface RouteConfig {
  message: string;
  version?: string;
  requiresAuth?: boolean;
  roles?: Role[];
}

export const RouteConfig = Reflector.createDecorator<RouteConfig>();

// export function RouteConfig(config: RouteConfig): MethodDecorator {
//   return applyDecorators(SetMetadata('routeConfig', config));
// }
