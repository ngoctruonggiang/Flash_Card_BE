/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { bcryptConstants } from 'src/utils/constants';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let provider: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

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

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up', async () => {
      // Sign up data
      // Mock so that email and username are not taken
      const signUpDto = {
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(
        signUpDto.password,
        bcryptConstants.saltOrRounds,
      );
      const mockResult = {
        id: 1,
        username: signUpDto.username,
        email: signUpDto.email,
        passwordHash: hashedPassword,
        lastLoginAt: new Date(),
      };
      mockUserService.create.mockResolvedValue(mockResult);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const jwtToken = await provider.signUp(signUpDto);

      // Validate Input Checks

      // TODO: Fix this
      expect(jwtToken).toBeDefined();
      expect(userService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
      expect(userService.findByUsername).toHaveBeenCalledWith(
        signUpDto.username,
      );

      expect(userService.create).toHaveBeenCalledWith({
        email: signUpDto.email,
        username: signUpDto.username,
        passwordHash: expect.any(String),
        lastLoginAt: expect.any(Date),
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockResult.id,
        username: mockResult.username,
      });
    });

    it('should not sign up with existing email', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        email: 'existinguser@example.com',
        passwordHash: 'hashedpassword',
        lastLoginAt: new Date(),
      };
      mockUserService.findByEmail.mockResolvedValue(existingUser);
      mockUserService.findByUsername.mockResolvedValue(null);

      // Test existing email
      await expect(
        provider.signUp({
          username: 'newuser',
          email: 'existinguser@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new HttpException('Email already in use', HttpStatus.BAD_REQUEST),
      );
      expect(userService.findByEmail).toHaveBeenCalledWith(
        'existinguser@example.com',
      );
    });

    it('should not sign up with existing username', async () => {
      const existingUser = {
        id: 1,
        username: 'existinguser',
        email: 'existinguser@example.com',
        passwordHash: 'hashedpassword',
        lastLoginAt: new Date(),
      };
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.findByUsername.mockResolvedValue(existingUser);

      // Test existing username
      await expect(
        provider.signUp({
          username: 'existinguser',
          email: 'newusafasafsaer@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new HttpException('Username already in use', HttpStatus.BAD_REQUEST),
      );
      expect(userService.findByUsername).toHaveBeenCalledWith('existinguser');
    });

    it('should fail with invalid email', async () => {
      await expect(
        provider.signUp({
          username: 'validUser',
          email: 'invalid-email',
          password: 'Password123',
        }),
      ).rejects.toThrow('Invalid email format');
    });

    it('should fail with invalid username', async () => {
      await expect(
        provider.signUp({
          username: 'ab', // too short
          email: 'test@example.com',
          password: 'Password123',
        }),
      ).rejects.toThrow('Invalid username format');
    });

    it('should fail with weak password', async () => {
      await expect(
        provider.signUp({
          username: 'validUser',
          email: 'test@example.com',
          password: 'weak',
        }),
      ).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('signIn', () => {
    it('should sign in', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(
        loginDto.password,
        bcryptConstants.saltOrRounds,
      );

      const mockUser = {
        id: 1,
        username: 'testuser',
        email: loginDto.email,
        passwordHash: hashedPassword,
        lastLoginAt: new Date(),
      };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const result = await provider.signIn(loginDto);

      // TODO: Fix this
      expect(result).toBeDefined();
      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
      });
    });

    it("shouldn't sign in invalid user", async () => {
      // Assume user not found
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        provider.signIn({
          email: 'wronguser@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new HttpException('Invalid email or password', HttpStatus.BAD_REQUEST),
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(
        'wronguser@example.com',
      );
    });

    it("shouldn't sign in wrong password", async () => {
      const user = {
        email: 'testuser@example.com',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(
        user.password,
        bcryptConstants.saltOrRounds,
      );
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: user.email,
        passwordHash: hashedPassword,
        lastLoginAt: new Date(),
      };
      mockUserService.findByEmail.mockResolvedValue(mockUser);
      await expect(
        provider.signIn({
          email: user.email,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(
        new HttpException('Invalid email or password', HttpStatus.BAD_REQUEST),
      );

      expect(userService.findByEmail).toHaveBeenCalledWith(user.email);
    });
  });
});
