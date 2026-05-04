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
    it('TC-VIEWPROFILE-001: This test case aims to verify retrieval of current logged-in user profile', async () => {
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
    });

    it('TC-VIEWPROFILE-002: This test case aims to verify getUserById is called with correct user id', async () => {
      const user = { ...mockUser, id: 42 };
      mockUserService.getUserById.mockResolvedValue(user);

      await controller.getCurrentUser(user as any);

      expect(userService.getUserById).toHaveBeenCalledWith(42);
    });

    it('TC-VIEWPROFILE-003: This test case aims to verify user profile is returned without password field', async () => {
      const userWithoutPassword = { ...mockUser };
      mockUserService.getUserById.mockResolvedValue(userWithoutPassword);

      const result = await controller.getCurrentUser(mockUser as any);

      expect(result).not.toHaveProperty('password');
    });

    it('TC-VIEWPROFILE-004: This test case aims to verify service errors are propagated correctly', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        'Database error',
      );
    });

    it('TC-VIEWPROFILE-005: This test case aims to verify NotFoundException is thrown when user not found', async () => {
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getCurrentUser(mockUser as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UC-05: Update User Profile', () => {
    it('TC-UPDATEPROFILE-001: This test case aims to verify successful user profile update', async () => {
      const updateDto = { username: 'newusername' };
      const updatedUser = { ...mockUser, username: 'newusername' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-UPDATEPROFILE-002: This test case aims to verify successful email update', async () => {
      const updateDto = { email: 'newemail@example.com' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        email: 'newemail@example.com',
      });

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toHaveProperty('email', 'newemail@example.com');
    });

    it('TC-UPDATEPROFILE-003: This test case aims to verify successful username update', async () => {
      const updateDto = { username: 'newuser' };
      mockUserService.update.mockResolvedValue({
        ...mockUser,
        username: 'newuser',
      });

      const result = await controller.update(mockUser as any, updateDto);

      expect(result).toHaveProperty('username', 'newuser');
    });

    it('TC-UPDATEPROFILE-004: This test case aims to verify successful password update', async () => {
      const updateDto = { password: 'newPassword123!' };
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-UPDATEPROFILE-005: This test case aims to verify handling of empty update data object', async () => {
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.update(mockUser as any, updateDto);

      expect(userService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
    });

    it('TC-UPDATEPROFILE-006: This test case aims to verify updating multiple fields simultaneously', async () => {
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

    it('TC-UPDATEPROFILE-007: This test case aims to verify BadRequestException for invalid data', async () => {
      const updateDto = { email: 'invalid-email' };
      mockUserService.update.mockRejectedValue(
        new BadRequestException('Invalid email'),
      );

      await expect(
        controller.update(mockUser as any, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('TC-UPDATEPROFILE-008: This test case aims to verify unicode characters handling in username', async () => {
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
    it('TC-DELETEACCOUNT-001: This test case aims to verify successful user account deletion', async () => {
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.remove(mockUser as any);

      expect(result).toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(mockUser.id);
    });

    it('TC-DELETEACCOUNT-002: This test case aims to verify remove is called with correct user id', async () => {
      const user = { ...mockUser, id: 123 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.remove(user as any);

      expect(userService.remove).toHaveBeenCalledWith(123);
    });

    it('TC-DELETEACCOUNT-003: This test case aims to verify service errors are propagated during deletion', async () => {
      mockUserService.remove.mockRejectedValue(new Error('Cannot delete user'));

      await expect(controller.remove(mockUser as any)).rejects.toThrow(
        'Cannot delete user',
      );
    });
  });

  describe('UC-04: View User Profile - Admin getAllUser', () => {
    it('TC-ADMINALLUSERS-001: This test case aims to verify return of all users', async () => {
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

    it('TC-ADMINALLUSERS-002: This test case aims to verify empty array is returned when no users exist', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);

      const result = await controller.getAllUser();

      expect(result).toEqual([]);
    });

    it('TC-ADMINALLUSERS-003: This test case aims to verify users are returned without passwords', async () => {
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

    it('TC-ADMINALLUSERS-004: This test case aims to verify service errors are propagated', async () => {
      mockUserService.getAllUsers.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.getAllUser()).rejects.toThrow('Database error');
    });
  });

  describe('UC-04: View User Profile - Admin getUserById', () => {
    it('TC-ADMINGETUSER-001: This test case aims to verify user is returned by id', async () => {
      const params = { id: 1 };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(params);

      expect(result).toEqual(mockUser);
      expect(userService.getUserById).toHaveBeenCalledWith(1);
    });

    it('TC-ADMINGETUSER-002: This test case aims to verify handling of different user ids', async () => {
      const params = { id: 999 };
      const user = { ...mockUser, id: 999 };
      mockUserService.getUserById.mockResolvedValue(user);

      const result = await controller.getUserById(params);

      expect(result).toEqual(user);
      expect(userService.getUserById).toHaveBeenCalledWith(999);
    });

    it('TC-ADMINGETUSER-003: This test case aims to verify NotFoundException propagation for non-existent user', async () => {
      const params = { id: 999 };
      mockUserService.getUserById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.getUserById(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-ADMINGETUSER-004: This test case aims to verify handling of id = 0', async () => {
      const params = { id: 0 };
      mockUserService.getUserById.mockResolvedValue(null);

      await controller.getUserById(params);

      expect(userService.getUserById).toHaveBeenCalledWith(0);
    });
  });

  describe('UC-05: Update User Profile - Admin updateAdmin', () => {
    it('TC-ADMINUPDATE-001: This test case aims to verify updating any user by id', async () => {
      const params = { id: 2 };
      const updateDto = { username: 'updateduser' };
      const updatedUser = { ...mockUser, id: 2, username: 'updateduser' };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateAdmin(params, updateDto);

      expect(result).toEqual(updatedUser);
      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });

    it('TC-ADMINUPDATE-002: This test case aims to verify updating user email', async () => {
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

    it('TC-ADMINUPDATE-003: This test case aims to verify updating user role', async () => {
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

    it('TC-ADMINUPDATE-004: This test case aims to verify NotFoundException propagation for non-existent user', async () => {
      const params = { id: 999 };
      const updateDto = { username: 'newname' };
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.updateAdmin(params, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-ADMINUPDATE-005: This test case aims to verify handling of empty update dto', async () => {
      const params = { id: 2 };
      const updateDto = {};
      mockUserService.update.mockResolvedValue(mockUser);

      await controller.updateAdmin(params, updateDto);

      expect(userService.update).toHaveBeenCalledWith(2, updateDto);
    });
  });

  describe('UC-06: Delete User Account - Admin removeAdmin', () => {
    it('TC-ADMINREMOVE-001: This test case aims to verify removing any user by id', async () => {
      const params = { id: 2 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      const result = await controller.removeAdmin(params);

      expect(result).toEqual({ deleted: true });
      expect(userService.remove).toHaveBeenCalledWith(2);
    });

    it('TC-ADMINREMOVE-002: This test case aims to verify NotFoundException propagation for non-existent user', async () => {
      const params = { id: 999 };
      mockUserService.remove.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(controller.removeAdmin(params)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-ADMINREMOVE-003: This test case aims to verify handling of removing admin user', async () => {
      const params = { id: 99 }; // Admin user id
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(99);
    });

    it('TC-ADMINREMOVE-004: This test case aims to verify handling of removing user with id 0', async () => {
      const params = { id: 0 };
      mockUserService.remove.mockResolvedValue({ deleted: true });

      await controller.removeAdmin(params);

      expect(userService.remove).toHaveBeenCalledWith(0);
    });
  });

  describe('Controller instantiation', () => {
    it('TC-USERCTRL-001: This test case aims to verify controller is defined', () => {
      expect(controller).toBeDefined();
    });

    it('TC-USERCTRL-002: This test case aims to verify userService is injected', () => {
      expect(userService).toBeDefined();
    });
  });
});
