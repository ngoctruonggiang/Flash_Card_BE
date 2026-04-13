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
      it('should register a new user successfully', async () => {
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

      it('should return access token in response', async () => {
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

      it('should return user info without password', async () => {
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
      it('should pass valid email to service', async () => {
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

      it('should propagate BadRequestException for invalid email', async () => {
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

      it('should propagate ConflictException for duplicate email', async () => {
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
      it('should pass valid username to service', async () => {
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

      it('should propagate ConflictException for duplicate username', async () => {
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

      it('should handle username with special characters', async () => {
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
      it('should pass valid password to service', async () => {
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

      it('should propagate BadRequestException for weak password', async () => {
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
      it('should handle empty strings', async () => {
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

      it('should handle very long email', async () => {
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

      it('should handle unicode in username', async () => {
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

      it('should handle service throwing unexpected error', async () => {
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
      it('should login user successfully', async () => {
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

      it('should return access token in response', async () => {
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

      it('should return user info without password', async () => {
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
      it('should propagate UnauthorizedException for wrong password', async () => {
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

      it('should propagate UnauthorizedException for non-existent user', async () => {
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

      it('should propagate BadRequestException for invalid email format', async () => {
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
      it('should handle empty credentials', async () => {
        const signInDto = {
          email: '',
          password: '',
        };
        mockAuthService.signIn.mockRejectedValue(
          new BadRequestException('Invalid input'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow();
      });

      it('should handle email with different cases', async () => {
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

      it('should handle password with special characters', async () => {
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

      it('should handle very long password', async () => {
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

      it('should handle unicode in password', async () => {
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

      it('should handle service throwing unexpected error', async () => {
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
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
    });
  });
});
