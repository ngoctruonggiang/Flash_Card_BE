/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { bcryptConstants } from 'src/utils/constants';
import { last } from 'rxjs';
import { sign } from 'crypto';

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

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should sign up', async () => {
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

    await provider.signUp(signUpDto);

    // Validate Input Checks
    expect(userService.findByEmail).toHaveBeenCalledWith(signUpDto.email);
    expect(userService.findByUsername).toHaveBeenCalledWith(signUpDto.username);

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
});
