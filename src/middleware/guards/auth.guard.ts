import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import express from 'express';
import { UserService } from 'src/services/user/user.service';
import { jwtConstants } from 'src/utils/constants';
import { RouteConfig } from 'src/utils/decorators/route.decorator';
import { JwtPayload } from 'src/utils/types/JWTTypes';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<express.Request>();

    const routeConfig = this.reflector.get(RouteConfig, context.getHandler());
    if (!routeConfig?.requiresAuth) return true;

    const token = this.extractTokenFromHeader(request);
    if (!token)
      throw new HttpException(
        'Unauthorized: No token provided',
        HttpStatus.UNAUTHORIZED,
      );

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      const user = await this.userService.findOne(payload.id);
      if (!user) {
        throw new HttpException(
          'Unauthorized: User not found',
          HttpStatus.UNAUTHORIZED,
        );
      }

      request['user'] = user;
    } catch {
      throw new HttpException(
        'Unauthorized: Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: express.Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
