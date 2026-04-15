/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthService } from 'src/services/auth/auth.service';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { createMockAuthService } from '../__helpers__';

describe('AuthController Tests', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = createMockAuthService();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  describe('UC-01: Register', () => {
    describe('Successful registration', () => {
      it('TC-074: should register user when valid credentials provided, returns user with access token', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'jwt-token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signUp.mockResolvedValue(expectedResponse);

        const result = await controller.register(signUpDto);

        expect(result).toEqual(expectedResponse);
        expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
        expect(authService.signUp).toHaveBeenCalledTimes(1);
      });

      it('TC-075: should return access token when registration successful, returns JWT token string', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'jwt-token-12345',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signUp.mockResolvedValue(expectedResponse);

        const result = await controller.register(signUpDto);

        expect(result).toHaveProperty('accessToken');
        expect(result.accessToken).toBe('jwt-token-12345');
      });

      it('TC-076: should return user info when registration successful, returns user without password', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'jwt-token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signUp.mockResolvedValue(expectedResponse);

        const result = await controller.register(signUpDto);

        expect(result).not.toHaveProperty('password');
      });
    });

    describe('Email validation', () => {
      it('TC-077: should pass valid email to service when email is valid, returns success', async () => {
        const signUpDto = {
          email: 'valid.email@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'valid.email@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'valid.email@example.com' }),
        );
      });

      it('TC-078: should throw BadRequestException when email format invalid, returns 400 error', async () => {
        const signUpDto = {
          email: 'invalid-email',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockRejectedValue(
          new BadRequestException('Invalid email'),
        );

        await expect(controller.register(signUpDto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('TC-079: should throw ConflictException when email already exists, returns 409 error', async () => {
        const signUpDto = {
          email: 'existing@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockRejectedValue(
          new ConflictException('Email already exists'),
        );

        await expect(controller.register(signUpDto)).rejects.toThrow(
          ConflictException,
        );
      });
    });

    describe('Username validation', () => {
      it('TC-080: should pass valid username to service when username is valid, returns success', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'valid_username123',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'valid_username123',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'valid_username123' }),
        );
      });

      it('TC-081: should throw ConflictException when username already exists, returns 409 error', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'existinguser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockRejectedValue(
          new ConflictException('Username already exists'),
        );

        await expect(controller.register(signUpDto)).rejects.toThrow(
          ConflictException,
        );
      });

      it('TC-082: should register user when username contains special chars, returns success', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'user_name-123',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'user_name-123',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      });
    });

    describe('Password validation', () => {
      it('TC-083: should pass valid password to service when password is strong, returns success', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'StrongP@ssw0rd!',
          confirmPassword: 'StrongP@ssw0rd!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(
          expect.objectContaining({ password: 'StrongP@ssw0rd!' }),
        );
      });

      it('TC-084: should throw BadRequestException when password is weak, returns 400 error', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: '123',
          confirmPassword: '123',
        };
        mockAuthService.signUp.mockRejectedValue(
          new BadRequestException('Password too weak'),
        );

        await expect(controller.register(signUpDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('Edge cases', () => {
      it('TC-085: should throw error when all fields are empty strings, returns error', async () => {
        const signUpDto = {
          email: '',
          username: '',
          password: '',
          confirmPassword: '',
        };
        mockAuthService.signUp.mockRejectedValue(
          new BadRequestException('Invalid input'),
        );

        await expect(controller.register(signUpDto)).rejects.toThrow();
      });

      it('TC-086: should register user when email is very long, returns success', async () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const signUpDto = {
          email: longEmail,
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: longEmail,
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      });

      it('TC-087: should register user when username contains unicode, returns success', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'tên_người_dùng',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'tên_người_dùng',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.register(signUpDto);

        expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
      });

      it('TC-088: should throw error when database fails, returns database error', async () => {
        const signUpDto = {
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          confirmPassword: 'Password123!',
        };
        mockAuthService.signUp.mockRejectedValue(new Error('Database error'));

        await expect(controller.register(signUpDto)).rejects.toThrow(
          'Database error',
        );
      });
    });
  });

  describe('UC-02: Login', () => {
    describe('Successful login', () => {
      it('TC-089: should login user when valid credentials provided, returns user with access token', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'jwt-token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signIn.mockResolvedValue(expectedResponse);

        const result = await controller.login(signInDto);

        expect(result).toEqual(expectedResponse);
        expect(authService.signIn).toHaveBeenCalledWith(signInDto);
        expect(authService.signIn).toHaveBeenCalledTimes(1);
      });

      it('TC-090: should return access token when login successful, returns JWT token string', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'valid-jwt-token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signIn.mockResolvedValue(expectedResponse);

        const result = await controller.login(signInDto);

        expect(result).toHaveProperty('accessToken');
        expect(typeof result.accessToken).toBe('string');
      });

      it('TC-091: should return user info when login successful, returns user without password', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'Password123!',
        };
        const expectedResponse = {
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
        mockAuthService.signIn.mockResolvedValue(expectedResponse);

        const result = await controller.login(signInDto);

        expect(result).not.toHaveProperty('password');
      });
    });

    describe('Failed login', () => {
      it('TC-092: should throw UnauthorizedException when password is wrong, returns 401 error', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'wrongpassword',
        };
        mockAuthService.signIn.mockRejectedValue(
          new UnauthorizedException('Invalid credentials'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('TC-093: should throw UnauthorizedException when user does not exist, returns 401 error', async () => {
        const signInDto = {
          email: 'nonexistent@example.com',
          password: 'Password123!',
        };
        mockAuthService.signIn.mockRejectedValue(
          new UnauthorizedException('Invalid credentials'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow(
          UnauthorizedException,
        );
      });

      it('TC-094: should throw BadRequestException when email format invalid, returns 400 error', async () => {
        const signInDto = {
          email: 'invalid-email',
          password: 'Password123!',
        };
        mockAuthService.signIn.mockRejectedValue(
          new BadRequestException('Invalid email'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('Edge cases', () => {
      it('TC-095: should throw error when credentials are empty, returns error', async () => {
        const signInDto = {
          email: '',
          password: '',
        };
        mockAuthService.signIn.mockRejectedValue(
          new BadRequestException('Invalid input'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow();
      });

      it('TC-096: should login user when email has different case, returns success', async () => {
        const signInDto = {
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!',
        };
        mockAuthService.signIn.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'TEST@EXAMPLE.COM',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.login(signInDto);

        expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      });

      it('TC-097: should login user when password has special chars, returns success', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'P@$$w0rd!#$%^&*()',
        };
        mockAuthService.signIn.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.login(signInDto);

        expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      });

      it('TC-098: should login user when password is very long, returns success', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'A'.repeat(1000),
        };
        mockAuthService.signIn.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.login(signInDto);

        expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      });

      it('TC-099: should login user when password contains unicode, returns success', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'Mật_khẩu_123!',
        };
        mockAuthService.signIn.mockResolvedValue({
          accessToken: 'token',
          id: 1,
          email: 'test@example.com',
          username: 'testuser',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });

        await controller.login(signInDto);

        expect(authService.signIn).toHaveBeenCalledWith(signInDto);
      });

      it('TC-100: should throw error when connection times out, returns timeout error', async () => {
        const signInDto = {
          email: 'test@example.com',
          password: 'Password123!',
        };
        mockAuthService.signIn.mockRejectedValue(
          new Error('Connection timeout'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow(
          'Connection timeout',
        );
      });
    });
  });

  describe('Controller instantiation', () => {
    it('TC-101: should be defined when module is compiled, returns defined controller', () => {
      expect(controller).toBeDefined();
    });

    it('TC-102: should have authService injected when module is compiled, returns defined service', () => {
      expect(authService).toBeDefined();
    });
  });
});
