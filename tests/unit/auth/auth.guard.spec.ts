/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from 'src/middleware/guards/auth.guard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/services/user/user.service';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import {
  createMockReflector,
  createMockJwtService,
  createMockUserService,
  createMockExecutionContext,
  createMockUser,
} from '../__helpers__';

describe('AuthGuard Tests', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let userService: UserService;

  const mockReflector = createMockReflector();

  const mockJwtService = createMockJwtService();

  const mockUserService = createMockUserService();

  const mockUser = createMockUser();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
    userService = module.get<UserService>(UserService);
  });

  describe('canActivate', () => {
    describe('Routes without authentication', () => {
      it('should allow access when requiresAuth is false', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: false });
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      });

      it('should allow access when no route config exists', async () => {
        mockReflector.get.mockReturnValue(undefined);
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('should allow access when route config is null', async () => {
        mockReflector.get.mockReturnValue(null);
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Routes with authentication', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('should allow access with valid token and existing user', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockResolvedValue(mockUser);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
        expect(userService.findOne).toHaveBeenCalledWith(1);
      });

      it('should set user on request object', async () => {
        const mockRequest: any = {
          headers: { authorization: 'Bearer valid-token' },
        };
        const context = {
          switchToHttp: () => ({
            getRequest: () => mockRequest,
          }),
          getHandler: () => jest.fn(),
        } as unknown as ExecutionContext;

        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockResolvedValue(mockUser);

        await guard.canActivate(context);

        expect(mockRequest['user']).toEqual(mockUser);
      });

      it('should throw HttpException when no token provided', async () => {
        const context = createMockExecutionContext({});

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('should throw HttpException with UNAUTHORIZED status when no token', async () => {
        const context = createMockExecutionContext({});

        try {
          await guard.canActivate(context);
          fail('Expected HttpException to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect((error as HttpException).getStatus()).toBe(
            HttpStatus.UNAUTHORIZED,
          );
        }
      });

      it('should throw HttpException when user not found', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 999 });
        mockUserService.findOne.mockRejectedValue(new Error('User not found'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: Invalid token',
        );
      });

      it('should throw HttpException when token is invalid', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer invalid-token',
        });
        mockJwtService.verifyAsync.mockRejectedValue(
          new Error('Invalid token'),
        );

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: Invalid token',
        );
      });

      it('should throw HttpException when token is expired', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer expired-token',
        });
        mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('should throw HttpException when token is malformed', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer malformed.token',
        });
        mockJwtService.verifyAsync.mockRejectedValue(
          new Error('jwt malformed'),
        );

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });
    });

    describe('Token extraction', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('should extract token from Bearer authorization header', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer my-jwt-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockResolvedValue(mockUser);

        await guard.canActivate(context);

        expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-jwt-token');
      });

      it('should not extract token with wrong authorization type', async () => {
        const context = createMockExecutionContext({
          authorization: 'Basic some-credentials',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('should handle missing authorization header', async () => {
        const context = createMockExecutionContext({});

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('should handle empty authorization header', async () => {
        const context = createMockExecutionContext({
          authorization: '',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('should handle Bearer without token', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer ',
        });

        // Empty token will be passed, should fail on verification
        mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('should handle authorization with extra spaces (fails due to implementation)', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer   token-with-spaces',
        });

        // split(' ') results in ['Bearer', '', '', 'token-with-spaces']
        // [type, token] = ['Bearer', ''] - empty string is falsy so should fail
        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });
    });

    describe('JWT payload handling', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('should use id from JWT payload to find user', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 42 });
        mockUserService.findOne.mockResolvedValue({ ...mockUser, id: 42 });

        await guard.canActivate(context);

        expect(userService.findOne).toHaveBeenCalledWith(42);
      });

      it('should handle payload with additional fields', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({
          id: 1,
          email: 'test@example.com',
          iat: 1234567890,
          exp: 1234567890,
        });
        mockUserService.findOne.mockResolvedValue(mockUser);

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(userService.findOne).toHaveBeenCalledWith(1);
      });
    });

    describe('Edge cases', () => {
      it('should handle concurrent requests', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockResolvedValue(mockUser);

        const contexts = Array.from({ length: 5 }, () =>
          createMockExecutionContext({ authorization: 'Bearer token' }),
        );

        const results = await Promise.all(
          contexts.map((ctx) => guard.canActivate(ctx)),
        );

        expect(results.every((r) => r === true)).toBe(true);
        expect(jwtService.verifyAsync).toHaveBeenCalledTimes(5);
      });

      it('should handle user service throwing error', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockRejectedValue(new Error('Database error'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('should handle different user roles', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
        const context = createMockExecutionContext({
          authorization: 'Bearer admin-token',
        });
        const adminUser = { ...mockUser, role: 'ADMIN' };
        mockJwtService.verifyAsync.mockResolvedValue({ id: 99 });
        mockUserService.findOne.mockResolvedValue(adminUser);

        const result = await guard.canActivate(context);

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

    it('should have jwtService injected', () => {
      expect(jwtService).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(userService).toBeDefined();
    });
  });
});
