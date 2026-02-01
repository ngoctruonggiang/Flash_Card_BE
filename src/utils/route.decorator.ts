import { applyDecorators, SetMetadata } from '@nestjs/common';

export const ROUTE_CONFIG_KEY = 'routeConfig';

export interface RouteConfig {
  message: string;
  version?: string;
  requiresAuth?: boolean;
  roles?: string[];
}

export const RouteConfig = (config: RouteConfig) =>
  applyDecorators(SetMetadata(ROUTE_CONFIG_KEY, config));
