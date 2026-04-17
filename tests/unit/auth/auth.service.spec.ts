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
    describe('Email Validation', () => {
      it('should reject empty email', async () => {
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

      it('should reject email without @ symbol', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'invalidemail.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject email without domain', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject email without TLD', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject email with spaces', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test @example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject email with multiple @ symbols', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should reject email starting with @', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: '@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should accept valid email with subdomain', async () => {
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

      it('should accept valid email with numbers', async () => {
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

      it('should accept valid email with dots in local part', async () => {
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

      it('should accept valid email with hyphens in local part', async () => {
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

      it('should accept valid email with underscores', async () => {
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

      it('should reject email with TLD shorter than 2 chars', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.c',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid email format');
      });

      it('should accept email with 4-char TLD', async () => {
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

    describe('Username Validation', () => {
      it('should reject empty username', async () => {
        await expect(
          provider.signUp({
            username: '',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should reject username shorter than 3 characters', async () => {
        await expect(
          provider.signUp({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should reject username with exactly 2 characters', async () => {
        await expect(
          provider.signUp({
            username: 'ab',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should accept username with exactly 3 characters', async () => {
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

      it('should reject username longer than 20 characters', async () => {
        await expect(
          provider.signUp({
            username: 'abcdefghijklmnopqrstuvwxyz',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should accept username with exactly 20 characters', async () => {
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

      it('should reject username with special characters', async () => {
        await expect(
          provider.signUp({
            username: 'user@name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should reject username with spaces', async () => {
        await expect(
          provider.signUp({
            username: 'user name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should reject username with hyphens', async () => {
        await expect(
          provider.signUp({
            username: 'user-name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should accept username with underscores', async () => {
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

      it('should accept username with numbers', async () => {
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

      it('should accept username starting with number', async () => {
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

      it('should accept username with all uppercase', async () => {
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

      it('should accept username with mixed case', async () => {
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

      it('should reject username with dots', async () => {
        await expect(
          provider.signUp({
            username: 'user.name',
            email: 'test@example.com',
            password: 'Password123',
          }),
        ).rejects.toThrow('Invalid username format');
      });

      it('should accept numeric-only username', async () => {
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

    describe('Password Validation', () => {
      it('should reject empty password', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: '',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should reject password shorter than 8 characters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'Pass1',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should reject password with exactly 7 characters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'Pass123',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should reject password without numbers', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: 'PasswordOnly',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should reject password without letters', async () => {
        await expect(
          provider.signUp({
            username: 'validUser',
            email: 'test@example.com',
            password: '12345678',
          }),
        ).rejects.toThrow('Password must be at least 8 characters long');
      });

      it('should accept password with exactly 8 characters', async () => {
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

      it('should accept password with special characters', async () => {
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

      it('should accept very long password', async () => {
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

      it('should accept password starting with number', async () => {
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

      it('should accept password ending with number', async () => {
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

      it('should accept password with spaces', async () => {
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

    describe('Duplicate Checking', () => {
      it('should reject duplicate email', async () => {
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

      it('should reject duplicate username', async () => {
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

      it('should validate email format before checking duplicates', async () => {
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

    describe('Successful SignUp', () => {
      it('should hash password before storing', async () => {
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

      it('should return JWT token', async () => {
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

      it('should return user details', async () => {
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

      it('should sign JWT with correct payload', async () => {
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
    describe('User Not Found', () => {
      it('should reject non-existent email', async () => {
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

      it('should call findByEmail with correct email', async () => {
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

    describe('Password Validation', () => {
      it('should reject incorrect password', async () => {
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

      it('should reject empty password', async () => {
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

      it('should reject password with extra spaces', async () => {
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

      it('should reject password with different case', async () => {
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

    describe('Successful SignIn', () => {
      it('should return JWT token on successful login', async () => {
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

      it('should return user details', async () => {
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

      it('should sign JWT with correct payload', async () => {
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

      it('should authenticate user with special characters in password', async () => {
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

      it('should authenticate user with very long password', async () => {
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
