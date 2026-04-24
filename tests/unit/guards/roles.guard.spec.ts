/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from 'src/middleware/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('RolesGuard  Tests', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    get: jest.fn(),
  };

  const createMockExecutionContext = (
    user: Record<string, unknown> | null = null,
  ): ExecutionContext => {
    const mockRequest: Record<string, unknown> = {};
    if (user) {
      mockRequest['user'] = user;
    }

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({}) as ReturnType<ExecutionContext['switchToRpc']>,
      switchToWs: () => ({}) as ReturnType<ExecutionContext['switchToWs']>,
      getType: () => 'http',
    } as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  describe('canActivate', () => {
    describe('Routes without authentication', () => {
      it('should allow access when requiresAuth is false', () => {
        mockReflector.get.mockReturnValue({ requiresAuth: false });
        const context = createMockExecutionContext();

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow access when no route config exists', () => {
        mockReflector.get.mockReturnValue(undefined);
        const context = createMockExecutionContext();

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow access when route config is null', () => {
        mockReflector.get.mockReturnValue(null);
        const context = createMockExecutionContext();

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Routes without role restrictions', () => {
      it('should allow access when roles array is empty', () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true, roles: [] });
        const context = createMockExecutionContext({ role: 'USER' });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow access when roles is undefined', () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
        const context = createMockExecutionContext({ role: 'USER' });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Routes with role restrictions', () => {
      describe('USER role', () => {
        it('should allow USER access to USER-only routes', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['USER'],
          });
          const context = createMockExecutionContext({ role: 'USER' });

          const result = guard.canActivate(context);

          expect(result).toBe(true);
        });

        it('should deny USER access to ADMIN-only routes', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['ADMIN'],
          });
          const context = createMockExecutionContext({ role: 'USER' });

          const result = guard.canActivate(context);

          expect(result).toBe(false);
        });

        it('should allow USER access to routes with multiple roles including USER', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['USER', 'ADMIN'],
          });
          const context = createMockExecutionContext({ role: 'USER' });

          const result = guard.canActivate(context);

          expect(result).toBe(true);
        });
      });

      describe('ADMIN role', () => {
        it('should allow ADMIN access to ADMIN-only routes', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['ADMIN'],
          });
          const context = createMockExecutionContext({ role: 'ADMIN' });

          const result = guard.canActivate(context);

          expect(result).toBe(true);
        });

        it('should deny ADMIN access to USER-only routes', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['USER'],
          });
          const context = createMockExecutionContext({ role: 'ADMIN' });

          const result = guard.canActivate(context);

          expect(result).toBe(false);
        });

        it('should allow ADMIN access to routes with multiple roles', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['USER', 'ADMIN', 'MODERATOR'],
          });
          const context = createMockExecutionContext({ role: 'ADMIN' });

          const result = guard.canActivate(context);

          expect(result).toBe(true);
        });
      });

      describe('Multiple roles', () => {
        it('should check against all allowed roles', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['ADMIN', 'MODERATOR', 'SUPER_ADMIN'],
          });
          const context = createMockExecutionContext({ role: 'MODERATOR' });

          const result = guard.canActivate(context);

          expect(result).toBe(true);
        });

        it('should deny when user role not in allowed roles', () => {
          mockReflector.get.mockReturnValue({
            requiresAuth: true,
            roles: ['ADMIN', 'SUPER_ADMIN'],
          });
          const context = createMockExecutionContext({ role: 'USER' });

          const result = guard.canActivate(context);

          expect(result).toBe(false);
        });
      });
    });

    describe('Edge cases', () => {
      it('should handle case-sensitive role comparison', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['USER'],
        });
        const context = createMockExecutionContext({ role: 'user' });

        const result = guard.canActivate(context);

        expect(result).toBe(false); // 'user' !== 'USER'
      });

      it('should handle undefined user role', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['USER'],
        });
        const context = createMockExecutionContext({ role: undefined });

        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should handle null user role', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['USER'],
        });
        const context = createMockExecutionContext({ role: null });

        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should handle empty string role', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['USER'],
        });
        const context = createMockExecutionContext({ role: '' });

        const result = guard.canActivate(context);

        expect(result).toBe(false);
      });

      it('should handle numeric role (edge case)', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['1'],
        });
        const context = createMockExecutionContext({ role: 1 });

        const result = guard.canActivate(context);

        expect(result).toBe(false); // 1 !== '1' in strict comparison
      });
    });

    describe('Route config variations', () => {
      it('should handle route config with message property', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['USER'],
          message: 'Test Route',
        });
        const context = createMockExecutionContext({ role: 'USER' });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should handle route config with additional properties', () => {
        mockReflector.get.mockReturnValue({
          requiresAuth: true,
          roles: ['ADMIN'],
          message: 'Admin Route',
          customProp: 'value',
        });
        const context = createMockExecutionContext({ role: 'ADMIN' });

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });
  });

  describe('Guard instantiation', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should have reflector injected', () => {
      expect(reflector).toBeDefined();
    });
  });
});
