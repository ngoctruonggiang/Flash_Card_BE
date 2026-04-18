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
    describe('Successful registration scenarios', () => {
      it('TC-REGISTER-001: This test case aims to verify successful user registration with valid input data', async () => {
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

      it('TC-REGISTER-002: This test case aims to verify that access token is returned in registration response', async () => {
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

      it('TC-REGISTER-003: This test case aims to verify that user info is returned without password field', async () => {
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

    describe('Email validation scenarios', () => {
      it('TC-REGISTER-004: This test case aims to verify that valid email is passed to service correctly', async () => {
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

      it('TC-REGISTER-005: This test case aims to verify BadRequestException is thrown for invalid email format', async () => {
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

      it('TC-REGISTER-006: This test case aims to verify ConflictException is thrown for duplicate email', async () => {
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

    describe('Username validation scenarios', () => {
      it('TC-REGISTER-007: This test case aims to verify that valid username is passed to service correctly', async () => {
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

      it('TC-REGISTER-008: This test case aims to verify ConflictException is thrown for duplicate username', async () => {
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

      it('TC-REGISTER-009: This test case aims to verify registration with username containing special characters', async () => {
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

    describe('Password validation scenarios', () => {
      it('TC-REGISTER-010: This test case aims to verify that valid password is passed to service correctly', async () => {
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

      it('TC-REGISTER-011: This test case aims to verify BadRequestException is thrown for weak password', async () => {
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

    describe('Edge cases and boundary conditions', () => {
      it('TC-REGISTER-012: This test case aims to verify handling of empty string inputs', async () => {
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

      it('TC-REGISTER-013: This test case aims to verify handling of very long email address', async () => {
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

      it('TC-REGISTER-014: This test case aims to verify handling of unicode characters in username', async () => {
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

      it('TC-REGISTER-015: This test case aims to verify handling of unexpected service errors', async () => {
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
    describe('Successful login scenarios', () => {
      it('TC-LOGIN-001: This test case aims to verify successful user login with valid credentials', async () => {
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

      it('TC-LOGIN-002: This test case aims to verify that access token is returned in login response', async () => {
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

      it('TC-LOGIN-003: This test case aims to verify that user info is returned without password field after login', async () => {
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

    describe('Failed login scenarios', () => {
      it('TC-LOGIN-004: This test case aims to verify UnauthorizedException is thrown for wrong password', async () => {
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

      it('TC-LOGIN-005: This test case aims to verify UnauthorizedException is thrown for non-existent user', async () => {
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

      it('TC-LOGIN-006: This test case aims to verify BadRequestException is thrown for invalid email format', async () => {
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

    describe('Edge cases and boundary conditions', () => {
      it('TC-LOGIN-007: This test case aims to verify handling of empty credentials', async () => {
        const signInDto = {
          email: '',
          password: '',
        };
        mockAuthService.signIn.mockRejectedValue(
          new BadRequestException('Invalid input'),
        );

        await expect(controller.login(signInDto)).rejects.toThrow();
      });

      it('TC-LOGIN-008: This test case aims to verify login with email containing different letter cases', async () => {
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

      it('TC-LOGIN-009: This test case aims to verify login with password containing special characters', async () => {
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

      it('TC-LOGIN-010: This test case aims to verify login with very long password', async () => {
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

      it('TC-LOGIN-011: This test case aims to verify login with password containing unicode characters', async () => {
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

      it('TC-LOGIN-012: This test case aims to verify handling of unexpected service errors during login', async () => {
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
