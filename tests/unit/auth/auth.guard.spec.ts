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

describe('UC-02: Login - AuthGuard Tests', () => {
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
    describe('Routes without authentication scenarios', () => {
      it('TC-LOGIN-013: This test case aims to verify access is allowed when requiresAuth is false', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: false });
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
        expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      });

      it('TC-LOGIN-014: This test case aims to verify access is allowed when no route config exists', async () => {
        mockReflector.get.mockReturnValue(undefined);
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });

      it('TC-LOGIN-015: This test case aims to verify access is allowed when route config is null', async () => {
        mockReflector.get.mockReturnValue(null);
        const context = createMockExecutionContext();

        const result = await guard.canActivate(context);

        expect(result).toBe(true);
      });
    });

    describe('Routes requiring authentication scenarios', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('TC-LOGIN-016: This test case aims to verify access is allowed with valid token and existing user', async () => {
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

      it('TC-LOGIN-017: This test case aims to verify user object is set on request', async () => {
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

      it('TC-LOGIN-018: This test case aims to verify HttpException is thrown when no token provided', async () => {
        const context = createMockExecutionContext({});

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('TC-LOGIN-019: This test case aims to verify UNAUTHORIZED status code when no token', async () => {
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

      it('TC-LOGIN-020: This test case aims to verify HttpException is thrown when user not found', async () => {
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

      it('TC-LOGIN-021: This test case aims to verify HttpException is thrown for invalid token', async () => {
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

      it('TC-LOGIN-022: This test case aims to verify HttpException is thrown for expired token', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer expired-token',
        });
        mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('TC-LOGIN-023: This test case aims to verify HttpException is thrown for malformed token', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer malformed.token',
        });
        mockJwtService.verifyAsync.mockRejectedValue(
          new Error('jwt malformed'),
        );

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });
    });

    describe('Token extraction scenarios', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('TC-LOGIN-024: This test case aims to verify token extraction from Bearer authorization header', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer my-jwt-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockResolvedValue(mockUser);

        await guard.canActivate(context);

        expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-jwt-token');
      });

      it('TC-LOGIN-025: This test case aims to verify token is not extracted with wrong authorization type', async () => {
        const context = createMockExecutionContext({
          authorization: 'Basic some-credentials',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('TC-LOGIN-026: This test case aims to verify handling of missing authorization header', async () => {
        const context = createMockExecutionContext({});

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('TC-LOGIN-027: This test case aims to verify handling of empty authorization header', async () => {
        const context = createMockExecutionContext({
          authorization: '',
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          'Unauthorized: No token provided',
        );
      });

      it('TC-LOGIN-028: This test case aims to verify handling of Bearer without token', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer ',
        });

        // Empty token will be passed, should fail on verification
        mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('TC-LOGIN-029: This test case aims to verify handling of authorization with extra spaces', async () => {
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

    describe('JWT payload handling scenarios', () => {
      beforeEach(() => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
      });

      it('TC-LOGIN-030: This test case aims to verify user id from JWT payload is used to find user', async () => {
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 42 });
        mockUserService.findOne.mockResolvedValue({ ...mockUser, id: 42 });

        await guard.canActivate(context);

        expect(userService.findOne).toHaveBeenCalledWith(42);
      });

      it('TC-LOGIN-031: This test case aims to verify handling of JWT payload with additional fields', async () => {
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

    describe('Edge cases and concurrent requests', () => {
      it('TC-LOGIN-032: This test case aims to verify handling of concurrent requests', async () => {
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

      it('TC-LOGIN-033: This test case aims to verify handling of user service throwing error', async () => {
        mockReflector.get.mockReturnValue({ requiresAuth: true });
        const context = createMockExecutionContext({
          authorization: 'Bearer valid-token',
        });
        mockJwtService.verifyAsync.mockResolvedValue({ id: 1 });
        mockUserService.findOne.mockRejectedValue(new Error('Database error'));

        await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      });

      it('TC-LOGIN-034: This test case aims to verify handling of different user roles', async () => {
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
    it('This test case aims to be defined', () => {
      expect(guard).toBeDefined();
    });

    it('This test case aims to have reflector injected', () => {
      expect(reflector).toBeDefined();
    });

    it('This test case aims to have jwtService injected', () => {
      expect(jwtService).toBeDefined();
    });

    it('This test case aims to have userService injected', () => {
      expect(userService).toBeDefined();
    });
  });
});
