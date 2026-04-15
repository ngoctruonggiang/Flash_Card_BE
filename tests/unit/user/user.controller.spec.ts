/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from 'src/controllers/user/user.controller';
import { UserService } from 'src/services/user/user.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UserController  Tests', () => {
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

  describe('UC-04: View User Profile', () => {
    it('TC-138: should return profile when current user requests, returns user profile', async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('TC-139: should call getUserById when user id is 42, returns profile for user 42', async () => {
      const user = { ...mockUser, id: 42 };
      mockUserService.getUserById.mockResolvedValue(user);

      await controller.getCurrentUser(user as any);

      expect(userService.getUserById).toHaveBeenCalledWith(42);
    });

    it('TC-140: should return user without password when profile requested, returns safe user object', async () => {
      const userWithoutPassword = { ...mockUser };
      mockUserService.getUserById.mockResolvedValue(userWithoutPassword);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).not.toHaveProperty('password');
    });

    it('TC-141: should throw error when database fails, returns error message', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('TC-142: should throw NotFoundException when user does not exist, returns 404 error', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UC-05: Update User Profile', () => {
    it('TC-143: should update profile when new username provided, returns updated user', async () => {
      const updateDto = { username: 'newusername' };
      const updatedUser = { ...mockUser, username: 'newusername' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-144: should update profile when new email provided, returns updated email', async () => {
      const updateDto = { email: 'newemail@example.com' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toHaveProperty('email', 'newemail@example.com');
    });

    it('TC-145: should update profile when username changed, returns new username', async () => {
      const updateDto = { username: 'newuser' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
      });

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toHaveProperty('username', 'newuser');
    });

    it('TC-146: should update profile when password changed, returns success', async () => {
      const updateDto = { password: 'newPassword123!' };
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-147: should update profile when empty dto provided, returns unchanged user', async () => {
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-148: should update profile when multiple fields provided, returns all updates', async () => {
      const updateDto = {
        username: 'newuser',
        email: 'new@example.com',
      };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        ...updateDto,
      });

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-149: should throw BadRequestException when email format invalid, returns 400 error', async () => {
      const updateDto = { email: 'invalid-email' };
      mockUserService.update.mockRejectedValue(
        new BadRequestException('Invalid email'),
      );

      await expect(
        controller.update(mockUser as any, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('TC-150: should update profile when username contains unicode, returns unicode username', async () => {
      const updateDto = { username: 'người_dùng_mới' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        username: 'người_dùng_mới',
      });

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });
  });

  describe('UC-06: Delete User Account', () => {
    it('TC-151: should delete account when current user requests, returns deleted confirmation', async () => {
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser as any);

      expect(result).toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('TC-152: should call remove when user id is 123, returns deleted confirmation', async () => {
      const user = { ...mockUser, id: 123 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.remove(user as any);

      expect(userService.remove).toHaveBeenCalledWith(123);
    });

    it('TC-153: should throw error when deletion fails, returns error message', async () => {
      mockUserService.remove.mockRejectedValue(new Error('Cannot delete user'));

      await expect(controller.remove(mockUser as any)).rejects.toThrow(
        'Cannot delete user',
      );
    });
  });

  describe('getAllUser (Admin)', () => {
    it('TC-154: should return all users when admin requests, returns array of users', async () => {
      const allUsers = [
        mockUser,
        { ...mockUser, id: 2, username: 'user2' },
        { ...mockUser, id: 3, username: 'user3' },
      ];
      mockUserService.getAllUsers.mockResolvedValue(allUsers);

      const result = await controller.getAllUser();

      expect(result).toEqual(allUsers);
      expect(userService.getAllUsers).toHaveBeenCalled();
    });

    it('TC-155: should return empty array when no users exist, returns empty array', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);

      const result = await controller.getAllUser();

      expect(result).toEqual([]);
    });

    it('TC-156: should return users without passwords when admin requests, returns safe user objects', async () => {
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

    it('TC-157: should throw error when database fails, returns error message', async () => {
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getAllUser()).rejects.toThrow('Database error');
    });
  });

  describe('getUserById (Admin)', () => {
    it('TC-158: should return user when valid id provided, returns user object', async () => {
      const params = { id: 1 };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(params);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it('TC-159: should return user when id is 999, returns user with id 999', async () => {
      const params = { id: 999 };
      const user = { ...mockUser, id: 999 };
      mockUserService.getUserById.mockResolvedValue(user);

      const result = await controller.getUserById(params);

      expect(result).toEqual(user);
      expect(userService.getUserById).toHaveBeenCalledWith(999);
    });

    it('TC-160: should throw NotFoundException when user does not exist, returns 404 error', async () => {
      const params = { id: 999 };
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserById(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-161: should call getUserById when id is 0, returns result for id 0', async () => {
      const params = { id: 0 };
      mockUserService.getUserById.mockResolvedValue(null);

      await controller.getUserById(params);

      expect(userService.getUserById).toHaveBeenCalledWith(0);
    });
  });

  describe('updateAdmin (Admin)', () => {
    it('TC-162: should update user when admin provides new username, returns updated user', async () => {
      const params = { id: 2 };
      const updateDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, id: 2, username: 'updateduser' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateAdmin(params, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('TC-163: should update user when admin provides new email, returns updated email', async () => {
      const params = { id: 2 };
      const updateDto = { email: 'updated@example.com' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        id: 2,
        email: 'updated@example.com',
      });

      await controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('TC-164: should update user when admin changes role to ADMIN, returns updated role', async () => {
      const params = { id: 2 };
      const updateDto = { role: 'ADMIN' as any };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        id: 2,
        role: 'ADMIN',
      });

      await controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('TC-165: should throw NotFoundException when user does not exist, returns 404 error', async () => {
      const params = { id: 999 };
      const updateDto = { username: 'newname' };
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.updateAdmin(params, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-166: should update user when empty dto provided, returns unchanged user', async () => {
      const params = { id: 2 };
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });
  });

  describe('removeAdmin (Admin)', () => {
    it('TC-167: should delete user when admin provides valid id, returns deleted confirmation', async () => {
      const params = { id: 2 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.removeAdmin(params);

      expect(result).toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(2);
    });

    it('TC-168: should throw NotFoundException when user does not exist, returns 404 error', async () => {
      const params = { id: 999 };
      mockUserService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.removeAdmin(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-169: should delete user when removing admin user, returns deleted confirmation', async () => {
      const params = { id: 99 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(99);
    });

    it('TC-170: should delete user when id is 0, returns deleted confirmation', async () => {
      const params = { id: 0 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(0);
    });
  });

  describe('Controller instantiation', () => {
    it('TC-171: should be defined when module is compiled, returns defined controller', () => {
      expect(controller).toBeDefined();
    });

    it('TC-172: should have userService injected when module is compiled, returns defined service', () => {
      expect(userService).toBeDefined();
    });
  });
});
