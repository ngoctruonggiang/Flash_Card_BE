/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
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
      expect(jwtToken).toEqual({ accessToken: 'mocked-jwt-token' });
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
  });

  describe('signIn', () => {
    it('should sign in', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(
        loginDto.password,
        bcryptConstants.saltOrRounds,
      );

      const mockUser = {
        id: 1,
        username: loginDto.username,
        email: 'testuser@example.com',
        passwordHash: hashedPassword,
        lastLoginAt: new Date(),
      };
      mockUserService.findByUsername.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mocked-jwt-token');

      const result = await provider.signIn(loginDto);

      expect(result).toEqual({ accessToken: 'mocked-jwt-token' });
      expect(userService.findByUsername).toHaveBeenCalledWith(
        loginDto.username,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        username: mockUser.username,
      });
    });

    it("shouldn't sign in invalid user", async () => {
      // Assume user not found
      mockUserService.findByUsername.mockResolvedValue(null);

      await expect(
        provider.signIn({
          username: 'wronguser',
          password: 'password123',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Invalid username or password',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith('wronguser');
    });

    it("shouldn't sign in wrong password", async () => {
      const user = {
        username: 'testuser',
        password: 'password123',
      };
      const hashedPassword = await bcrypt.hash(
        user.password,
        bcryptConstants.saltOrRounds,
      );
      const mockUser = {
        id: 1,
        username: user.username,
        email: 'testuser@example.com',
        passwordHash: hashedPassword,
        lastLoginAt: new Date(),
      };
      mockUserService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        provider.signIn({
          username: user.username,
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(
        new HttpException(
          'Invalid username or password',
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(userService.findByUsername).toHaveBeenCalledWith(user.username);
    });
  });
});
