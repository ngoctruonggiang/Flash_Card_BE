/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';
import { AuthController } from './auth.controller';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { SignInDto } from 'src/utils/types/dto/user/signIn.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up a new user and return JWT token', async () => {
      const signUpDto: SignUpDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const mockJwtToken = {
        accessToken: 'mocked_jwt_token',
      };

      mockAuthService.signUp.mockResolvedValue(mockJwtToken);

      const result = await controller.register(signUpDto);

      expect(result).toEqual(mockJwtToken);
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });

    it('should handle sign up errors', async () => {
      const signUpDto: SignUpDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const mockError = new Error('Email already in use');
      mockAuthService.signUp.mockRejectedValue(mockError);

      await expect(controller.register(signUpDto)).rejects.toThrow(
        'Email already in use',
      );
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('signIn', () => {
    it('should sign in a user and return JWT token', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockJwtToken = {
        accessToken: 'mocked_jwt_token',
      };

      mockAuthService.signIn.mockResolvedValue(mockJwtToken);

      const result = await controller.login(signInDto);

      expect(result).toEqual(mockJwtToken);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });

    it('should handle sign in errors', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid username or password');
      mockAuthService.signIn.mockRejectedValue(mockError);

      await expect(controller.login(signInDto)).rejects.toThrow(
        'Invalid username or password',
      );
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });
  });
});
