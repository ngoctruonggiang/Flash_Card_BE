/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let authService: AuthService;

  const mockUserService = {
    getUserById: jest.fn(),
    getAllUsers: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
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
      const signUpDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockJwtToken = {
        accessToken: 'mocked_jwt_token',
      };

      mockAuthService.signUp.mockResolvedValue(mockJwtToken);

      const result = await controller.signUp(signUpDto);

      expect(result).toEqual(mockJwtToken);
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });

    it('should handle sign up errors', async () => {
      const signUpDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const mockError = new Error('Email already in use');
      mockAuthService.signUp.mockRejectedValue(mockError);

      await expect(controller.signUp(signUpDto)).rejects.toThrow(
        'Email already in use',
      );
      expect(authService.signUp).toHaveBeenCalledWith(signUpDto);
    });
  });

  describe('signIn', () => {
    it('should sign in a user and return JWT token', async () => {
      const signInDto = {
        username: 'testuser',
        password: 'password123',
      };

      const mockJwtToken = {
        accessToken: 'mocked_jwt_token',
      };

      mockAuthService.signIn.mockResolvedValue(mockJwtToken);

      const result = await controller.signIn(signInDto);

      expect(result).toEqual(mockJwtToken);
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });

    it('should handle sign in errors', async () => {
      const signInDto = {
        username: 'wronguser',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid username or password');
      mockAuthService.signIn.mockRejectedValue(mockError);

      await expect(controller.signIn(signInDto)).rejects.toThrow(
        'Invalid username or password',
      );
      expect(authService.signIn).toHaveBeenCalledWith(signInDto);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const mockUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: mockUser.createdAt,
        lastLoginAt: mockUser.lastLoginAt,
      };

      mockUserService.getUserById.mockResolvedValue(mockUserDto);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).toEqual(mockUserDto);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe('update (user action)', () => {
    it('should update current user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const updateDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: mockUser.createdAt,
        lastLoginAt: new Date(),
      };

      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(userService.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update user password', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const updateDto = {
        password: 'newpassword123',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'newhashedpassword',
        role: 'USER',
        createdAt: mockUser.createdAt,
        lastLoginAt: new Date(),
      };

      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(userService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove (user action)', () => {
    it('should delete current user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      const mockDeletedUser = {
        ...mockUser,
      };

      mockUserService.remove.mockResolvedValue(mockDeletedUser);

      const result = await controller.remove(mockUser as any);

      expect(result).toEqual(mockDeletedUser);
      expect(userService.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('getUserById (admin action)', () => {
    it('should return user by id', async () => {
      const mockUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockUserService.getUserById.mockResolvedValue(mockUserDto);

      const result = await controller.getUserById({ id: 1 });

      expect(result).toEqual(mockUserDto);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });
  });

  describe('getAllUser (admin action)', () => {
    it('should return all users', async () => {
      const mockUsers = [
        {
          username: 'user1',
          email: 'user1@example.com',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          role: 'ADMIN',
          createdAt: new Date(),
          lastLoginAt: new Date(),
        },
      ];

      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      const result = await controller.getAllUser();

      expect(result).toEqual(mockUsers);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });
  });

  describe('updateAdmin (admin action)', () => {
    it('should update any user by id', async () => {
      const updateDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = {
        id: 2,
        username: 'updateduser',
        email: 'updated@example.com',
        passwordHash: 'hashedpassword',
        role: 'ADMIN',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateAdmin({ id: 2 }, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });
  });

  describe('removeAdmin (admin action)', () => {
    it('should delete any user by id', async () => {
      const mockDeletedUser = {
        id: 2,
        username: 'userToDelete',
        email: 'delete@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      mockUserService.remove.mockResolvedValue(mockDeletedUser);

      const result = await controller.removeAdmin({ id: 2 });

      expect(result).toEqual(mockDeletedUser);
      expect(userService.remove).toHaveBeenCalledWith(2);
    });
  });
});
