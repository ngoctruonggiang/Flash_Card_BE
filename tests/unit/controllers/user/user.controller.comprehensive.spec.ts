/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from 'src/controllers/user/user.controller';
import { UserService } from 'src/services/user/user.service';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('UserController - Comprehensive Tests', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    getUserById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getAllUsers: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminUser = {
    id: 99,
    email: 'admin@example.com',
    username: 'admin',
    role: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  describe('getCurrentUser', () => {
    it('should return current user profile', async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should call getUserById with correct user id', async () => {
      const user = { ...mockUser, id: 42 };
      mockUserService.getUserById.mockResolvedValue(user);

      await controller.getCurrentUser(user as any);

      expect(userService.getUserById).toHaveBeenCalledWith(42);
    });

    it('should return user without password', async () => {
      const userWithoutPassword = { ...mockUser };
      mockUserService.getUserById.mockResolvedValue(userWithoutPassword);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).not.toHaveProperty('password');
    });

    it('should propagate service errors', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('should propagate NotFoundException', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const updateDto = { username: 'newusername' };
      const updatedUser = { ...mockUser, username: 'newusername' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = controller.update(mockUser as any, updateDto);

      expect(result).resolves.toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should update email', async () => {
      const updateDto = { email: 'newemail@example.com' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const result = controller.update(mockUser as any, updateDto);

      expect(result).resolves.toHaveProperty('email', 'newemail@example.com');
    });

    it('should update username', async () => {
      const updateDto = { username: 'newuser' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
      });

      const result = controller.update(mockUser as any, updateDto);

      expect(result).resolves.toHaveProperty('username', 'newuser');
    });

    it('should update password', async () => {
      const updateDto = { password: 'newPassword123!' };
      mockUserService.update.mockResolvedValue(mockUser);

      controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should handle empty update dto', async () => {
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should handle multiple fields update', async () => {
      const updateDto = {
        username: 'newuser',
        email: 'new@example.com',
      };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('should propagate BadRequestException for invalid data', async () => {
      const updateDto = { email: 'invalid-email' };
      mockUserService.update.mockRejectedValue(
        new BadRequestException('Invalid email'),
      );

      await expect(
        controller.update(mockUser as any, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle unicode in username', async () => {
      const updateDto = { username: 'người_dùng_mới' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        username: 'người_dùng_mới',
      });

      controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove user account', async () => {
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = controller.remove(mockUser as any);

      expect(result).resolves.toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('should call remove with correct user id', async () => {
      const user = { ...mockUser, id: 123 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      controller.remove(user as any);

      expect(userService.remove).toHaveBeenCalledWith(123);
    });

    it('should propagate service errors', async () => {
      mockUserService.remove.mockRejectedValue(new Error('Cannot delete user'));

      await expect(controller.remove(mockUser as any)).rejects.toThrow(
        'Cannot delete user',
      );
    });
  });

  describe('getAllUser (Admin)', () => {
    it('should return all users', async () => {
      const allUsers = [
        mockUser,
        { ...mockUser, id: 2, username: 'user2' },
        { ...mockUser, id: 3, username: 'user3' },
      ];
      mockUserService.getAllUsers.mockResolvedValue(allUsers);

      const result = controller.getAllUser();

      expect(result).resolves.toEqual(allUsers);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);

      const result = controller.getAllUser();

      expect(result).resolves.toEqual([]);
    });

    it('should return users without passwords', async () => {
      const usersWithoutPasswords = [
        { id: 1, email: 'user1@example.com', username: 'user1' },
        { id: 2, email: 'user2@example.com', username: 'user2' },
      ];
      mockUserService.getAllUsers.mockResolvedValue(usersWithoutPasswords);

      const result = await controller.getAllUser();

      result.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should propagate service errors', async () => {
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getAllUser()).rejects.toThrow('Database error');
    });
  });

  describe('getUserById (Admin)', () => {
    it('should return user by id', async () => {
      const params = { id: 1 };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = controller.getUserById(params);

      expect(result).resolves.toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it('should handle different user ids', async () => {
      const params = { id: 999 };
      const user = { ...mockUser, id: 999 };
      mockUserService.getUserById.mockResolvedValue(user);

      const result = controller.getUserById(params);

      expect(result).resolves.toEqual(user);
      expect(userService.getUserById).toHaveBeenCalledWith(999);
    });

    it('should propagate NotFoundException for non-existent user', async () => {
      const params = { id: 999 };
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserById(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle id = 0', async () => {
      const params = { id: 0 };
      mockUserService.getUserById.mockResolvedValue(null);

      const result = controller.getUserById(params);

      expect(userService.getUserById).toHaveBeenCalledWith(0);
    });
  });

  describe('updateAdmin (Admin)', () => {
    it('should update any user by id', async () => {
      const params = { id: 2 };
      const updateDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, id: 2, username: 'updateduser' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = controller.updateAdmin(params, updateDto);

      expect(result).resolves.toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('should update user email', async () => {
      const params = { id: 2 };
      const updateDto = { email: 'updated@example.com' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        id: 2,
        email: 'updated@example.com',
      });

      controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('should update user role', async () => {
      const params = { id: 2 };
      const updateDto = { role: 'ADMIN' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        id: 2,
        role: 'ADMIN',
      });

      controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('should propagate NotFoundException for non-existent user', async () => {
      const params = { id: 999 };
      const updateDto = { username: 'newname' };
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.updateAdmin(params, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle empty update dto', async () => {
      const params = { id: 2 };
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });
  });

  describe('removeAdmin (Admin)', () => {
    it('should remove any user by id', async () => {
      const params = { id: 2 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = controller.removeAdmin(params);

      expect(result).resolves.toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(2);
    });

    it('should propagate NotFoundException for non-existent user', async () => {
      const params = { id: 999 };
      mockUserService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.removeAdmin(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle removing admin user', async () => {
      const params = { id: 99 }; // Admin user id
      mockUserService.remove.mockResolvedValue({ deleted: true });

      controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(99);
    });

    it('should handle removing user with id 0', async () => {
      const params = { id: 0 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(0);
    });
  });

  describe('Controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have userService injected', () => {
      expect(userService).toBeDefined();
    });
  });
});
