import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import express from 'express';
import { Observable } from 'rxjs';
import { RouteConfig } from 'src/utils/route.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<express.Request>();
    const routeConfig = this.reflector.get(RouteConfig, context.getHandler());
    if (!routeConfig?.requiresAuth) return true;
    return true; // Implement your authentication logic here
  }
}
