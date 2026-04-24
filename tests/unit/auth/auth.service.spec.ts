/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { bcryptConstants } from 'src/utils/constants';
import { HttpException, HttpStatus } from '@nestjs/common';
import { createMockUserService, createMockJwtService } from '../__helpers__';

describe('AuthService Tests', () => {
  let provider: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = createMockUserService();

  const mockJwtService = createMockJwtService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    provider = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UC-01: Register', () => {
    describe('Email validation scenarios', () => {
      it('TC-REGISTER-016: This test case aims to verify rejection of empty email', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: '',
            password: 'Password123',
          }),
        ).rejects.toThrow(
          new HttpException('Invalid email format', HttpStatus.BAD_REQUEST),
        );
      });

      it('TC-REGISTER-017: This test case aims to verify rejection of email without @ symbol', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'invalidemail.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-018: This test case aims to verify rejection of email without domain', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-019: This test case aims to verify rejection of email without TLD', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-020: This test case aims to verify rejection of email with spaces', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test @example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-021: This test case aims to verify rejection of email with multiple @ symbols', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-022: This test case aims to verify rejection of email starting with @', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: '@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-023: This test case aims to verify acceptance of valid email with subdomain', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@mail.example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@mail.example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
        expect(result.accessToken).toBe('token');
      });

      it('TC-REGISTER-024: This test case aims to verify acceptance of valid email with numbers', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test123@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test123@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-025: This test case aims to verify acceptance of valid email with dots in local part', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test.user@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test.user@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-026: This test case aims to verify acceptance of valid email with hyphens in local part', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test-user@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test-user@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-027: This test case aims to verify acceptance of valid email with underscores', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test_user@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test_user@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-028: This test case aims to verify rejection of email with TLD shorter than 2 chars', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.c',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('TC-REGISTER-029: This test case aims to verify acceptance of email with 4-char TLD', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.info',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.info',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });
    });

    describe('Username validation scenarios', () => {
      it('TC-REGISTER-030: This test case aims to verify rejection of empty username', async () => {
        await expect(
          provider.signUp({
            username: '',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-031: This test case aims to verify rejection of username shorter than 3 characters', async () => {
        await expect(
          provider.signUp({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-032: This test case aims to verify rejection of username with exactly 2 characters', async () => {
        await expect(
          provider.signUp({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-033: This test case aims to verify acceptance of username with exactly 3 characters', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'abc',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'abc',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-034: This test case aims to verify rejection of username longer than 20 characters', async () => {
        await expect(
          provider.signUp({
            username: 'abcdefghijklmnopqrstuvwxyz',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-035: This test case aims to verify acceptance of username with exactly 20 characters', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'abcdefghijklmnopqrst',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'abcdefghijklmnopqrst',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-036: This test case aims to verify rejection of username with special characters', async () => {
        await expect(
          provider.signUp({
            username: 'user@name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-037: This test case aims to verify rejection of username with spaces', async () => {
        await expect(
          provider.signUp({
            username: 'user name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-038: This test case aims to verify rejection of username with hyphens', async () => {
        await expect(
          provider.signUp({
            username: 'user-name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-039: This test case aims to verify acceptance of username with underscores', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'user_name',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'user_name',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-040: This test case aims to verify acceptance of username with numbers', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'user123',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'user123',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-041: This test case aims to verify acceptance of username starting with number', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: '123user',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: '123user',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-042: This test case aims to verify acceptance of username with all uppercase', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'UPPERCASE',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'UPPERCASE',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-043: This test case aims to verify acceptance of username with mixed case', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'MixedCase',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'MixedCase',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-044: This test case aims to verify rejection of username with dots', async () => {
        await expect(
          provider.signUp({
            username: 'user.name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('TC-REGISTER-045: This test case aims to verify acceptance of numeric-only username', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: '12345',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: '12345',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result).toBeDefined();
      });
    });

    describe('Password validation scenarios', () => {
      it('TC-REGISTER-046: This test case aims to verify rejection of empty password', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: '',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('TC-REGISTER-047: This test case aims to verify rejection of password shorter than 8 characters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'Pass1',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('TC-REGISTER-048: This test case aims to verify rejection of password with exactly 7 characters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'Pass123',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('TC-REGISTER-049: This test case aims to verify rejection of password without numbers', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'PasswordOnly',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('TC-REGISTER-050: This test case aims to verify rejection of password without letters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: '12345678',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('TC-REGISTER-051: This test case aims to verify acceptance of password with exactly 8 characters', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'Passw0rd',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-052: This test case aims to verify acceptance of password with special characters', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'P@ssw0rd!',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-053: This test case aims to verify acceptance of very long password', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'ThisIsAVeryLongPassword123WithManyCharacters',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-054: This test case aims to verify acceptance of password starting with number', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: '1Password',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-055: This test case aims to verify acceptance of password ending with number', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'Password1',
        });

        expect(result).toBeDefined();
      });

      it('TC-REGISTER-056: This test case aims to verify acceptance of password with spaces', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'validUser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'Pass word 123',
        });

        expect(result).toBeDefined();
      });
    });

    describe('Duplicate checking scenarios', () => {
      it('TC-REGISTER-057: This test case aims to verify rejection of duplicate email', async () => {
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          email: 'existing@example.com',
        });

        await expect(
          provider.signUp({
            username: 'newuser',
            email: 'existing@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow(
          new HttpException('Email already in use', HttpStatus.CONFLICT),
        );
      });

      it('TC-REGISTER-058: This test case aims to verify rejection of duplicate username', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue({
          id: 1,
          username: 'existinguser',
        });

        await expect(
          provider.signUp({
            username: 'existinguser',
            email: 'new@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow(
          new HttpException('Username already in use', HttpStatus.CONFLICT),
        );
      });

      it('TC-REGISTER-059: This test case aims to verify email format validation before checking duplicates', async () => {
        // Should throw email format error, not duplicate error
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'invalid-email',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');

        expect(mockUserService.findByEmail).not.toHaveBeenCalled();
      });
    });

    describe('Successful signup scenarios', () => {
      it('TC-REGISTER-060: This test case aims to verify password hashing before storing', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        await provider.signUp({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(mockUserService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            username: 'testuser',
            passwordHash: expect.any(String),
            lastLoginAt: expect.any(Date),
          }),
        );

        // Verify password is hashed
        const createCall = mockUserService.create.mock.calls[0][0];
        expect(createCall.passwordHash).not.toBe('Password123');
        expect(createCall.passwordHash.length).toBeGreaterThan(10);
      });

      it('TC-REGISTER-061: This test case aims to verify return of JWT token', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('jwt-token-123');

        const result = await provider.signUp({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result.accessToken).toBe('jwt-token-123');
      });

      it('TC-REGISTER-062: This test case aims to verify return of user details', async () => {
        const createdAt = new Date();
        const lastLoginAt = new Date();
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          role: 'USER',
          createdAt,
          lastLoginAt,
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signUp({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result.id).toBe(1);
        expect(result.username).toBe('testuser');
        expect(result.email).toBe('test@example.com');
        expect(result.role).toBe('USER');
        expect(result.createdAt).toBe(createdAt);
        expect(result.lastLoginAt).toBe(lastLoginAt);
      });

      it('TC-REGISTER-063: This test case aims to verify JWT signing with correct payload', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);
        mockUserService.findByUsername.mockResolvedValue(null);
        mockUserService.create.mockResolvedValue({
          id: 99,
          username: 'jwtuser',
          email: 'jwt@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        await provider.signUp({
          username: 'jwtuser',
          email: 'jwt@example.com',
          password: 'Password123',
        });

        expect(mockJwtService.sign).toHaveBeenCalledWith({
          id: 99,
          username: 'jwtuser',
        });
      });
    });
  });

  describe('UC-02: Login', () => {
    describe('User not found scenarios', () => {
      it('TC-LOGIN-035: This test case aims to verify rejection of non-existent email', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);

        await expect(
          provider.signIn({
            email: 'nonexistent@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow(
          new HttpException(
            'Invalid email or password',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('TC-LOGIN-036: This test case aims to verify findByEmail called with correct email', async () => {
        mockUserService.findByEmail.mockResolvedValue(null);

        await expect(
          provider.signIn({
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow();

        expect(mockUserService.findByEmail).toHaveBeenCalledWith(
          'test@example.com',
        );
      });
    });

    describe('Password validation scenarios', () => {
      it('TC-LOGIN-037: This test case aims to verify rejection of incorrect password', async () => {
        const hashedPassword = await bcrypt.hash(
          'CorrectPassword123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
        });

        await expect(
          provider.signIn({
            email: 'test@example.com',
            password: 'WrongPassword123',
          }),
        ).rejects.toThrow(
          new HttpException(
            'Invalid email or password',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('TC-LOGIN-038: This test case aims to verify rejection of empty password', async () => {
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
        });

        await expect(
          provider.signIn({
            email: 'test@example.com',
            password: '',
          }),
        ).rejects.toThrow(
          new HttpException(
            'Invalid email or password',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('TC-LOGIN-039: This test case aims to verify rejection of password with extra spaces', async () => {
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
        });

        await expect(
          provider.signIn({
            email: 'test@example.com',
            password: ' Password123',
          }),
        ).rejects.toThrow(
          new HttpException(
            'Invalid email or password',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });

      it('TC-LOGIN-040: This test case aims to verify rejection of password with different case', async () => {
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
        });

        await expect(
          provider.signIn({
            email: 'test@example.com',
            password: 'PASSWORD123',
          }),
        ).rejects.toThrow(
          new HttpException(
            'Invalid email or password',
            HttpStatus.BAD_REQUEST,
          ),
        );
      });
    });

    describe('Successful sign-in scenarios', () => {
      it('TC-LOGIN-041: This test case aims to verify return of JWT token on successful login', async () => {
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('jwt-token');

        const result = await provider.signIn({
          email: 'test@example.com',
          password: 'Password123',
        });

        expect(result.accessToken).toBe('jwt-token');
      });

      it('TC-LOGIN-042: This test case aims to verify return of user details', async () => {
        const createdAt = new Date();
        const lastLoginAt = new Date();
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 5,
          username: 'loginuser',
          email: 'login@example.com',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          createdAt,
          lastLoginAt,
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signIn({
          email: 'login@example.com',
          password: 'Password123',
        });

        expect(result.id).toBe(5);
        expect(result.username).toBe('loginuser');
        expect(result.email).toBe('login@example.com');
        expect(result.role).toBe('ADMIN');
        expect(result.createdAt).toBe(createdAt);
        expect(result.lastLoginAt).toBe(lastLoginAt);
      });

      it('TC-LOGIN-043: This test case aims to verify JWT signing with correct payload', async () => {
        const hashedPassword = await bcrypt.hash(
          'Password123',
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 42,
          username: 'jwttest',
          email: 'jwttest@example.com',
          passwordHash: hashedPassword,
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        await provider.signIn({
          email: 'jwttest@example.com',
          password: 'Password123',
        });

        expect(mockJwtService.sign).toHaveBeenCalledWith({
          id: 42,
          username: 'jwttest',
        });
      });

      it('TC-LOGIN-044: This test case aims to verify authentication with special characters in password', async () => {
        const specialPassword = 'P@ss!w0rd#$%^&*()';
        const hashedPassword = await bcrypt.hash(
          specialPassword,
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signIn({
          email: 'test@example.com',
          password: specialPassword,
        });

        expect(result.accessToken).toBe('token');
      });

      it('TC-LOGIN-045: This test case aims to verify authentication with very long password', async () => {
        const longPassword =
          'ThisIsAVeryLongPasswordThatShouldStillWorkCorrectly123456789';
        const hashedPassword = await bcrypt.hash(
          longPassword,
          bcryptConstants.saltOrRounds,
        );
        mockUserService.findByEmail.mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: hashedPassword,
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        });
        mockJwtService.sign.mockReturnValue('token');

        const result = await provider.signIn({
          email: 'test@example.com',
          password: longPassword,
        });

        expect(result.accessToken).toBe('token');
      });
    });
  });
});
