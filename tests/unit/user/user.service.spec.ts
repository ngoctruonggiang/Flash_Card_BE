/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/services/user/user.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserDto } from 'src/utils/types/dto/user/user.dto';
import { User } from '@prisma/client';

describe('UserService  Tests', () => {
  let provider: UserService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    provider = module.get<UserService>(UserService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UC-01: Register (Create)', () => {
    it('TC-REGISTER-101: This test case aims to verify creating a user with all required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result).toEqual({ id: 1, ...userData });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });

    it('TC-REGISTER-102: This test case aims to verify creating user with minimum required fields', async () => {
      const userData = {
        username: 'abc',
        email: 'a@b.co',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result).toBeDefined();
    });

    it('TC-REGISTER-103: This test case aims to verify handling very long username', async () => {
      const userData = {
        username: 'a'.repeat(255),
        email: 'test@example.com',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result.username).toBe('a'.repeat(255));
    });

    it('TC-REGISTER-104: This test case aims to verify handling very long email', async () => {
      const userData = {
        username: 'testuser',
        email: 'a'.repeat(100) + '@example.com',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result.email).toBe('a'.repeat(100) + '@example.com');
    });

    it('TC-REGISTER-105: This test case aims to verify handling very long password hash', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash'.repeat(100),
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result.passwordHash).toBe('hash'.repeat(100));
    });

    it('TC-REGISTER-106: This test case aims to verify handling lastLoginAt as specific date', async () => {
      const specificDate = new Date('2025-01-01T00:00:00.000Z');
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
        lastLoginAt: specificDate,
      };
      mockPrismaService.user.create.mockResolvedValue({ id: 1, ...userData });

      const result = await provider.create(userData);

      expect(result.lastLoginAt).toEqual(specificDate);
    });

    it('TC-REGISTER-107: This test case aims to verify handling database error on create', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(provider.create(userData)).rejects.toThrow('Database error');
    });

    it('TC-REGISTER-108: This test case aims to verify handling unique constraint violation', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        passwordHash: 'hash',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockRejectedValue(
        new Error('Unique constraint failed'),
      );

      await expect(provider.create(userData)).rejects.toThrow(
        'Unique constraint failed',
      );
    });
  });

  describe('UC-04: View User Profile (Get By ID)', () => {
    it('TC-VIEWUSERPROFILE-001: This test case aims to verify returning UserDto for existing user', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.getUserById(1);

      expect(result).toEqual(new UserDto(mockUser));
    });

    it('TC-VIEWUSERPROFILE-002: This test case aims to verify throwing NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(provider.getUserById(999)).rejects.toThrow(
        'User with id 999 not found',
      );
    });

    it('TC-VIEWUSERPROFILE-003: This test case aims to verify throwing NotFoundException for id = 0', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(provider.getUserById(0)).rejects.toThrow(
        'User with id 0 not found',
      );
    });

    it('TC-VIEWUSERPROFILE-004: This test case aims to verify throwing NotFoundException for negative id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(provider.getUserById(-1)).rejects.toThrow(
        'User with id -1 not found',
      );
    });

    it('TC-VIEWUSERPROFILE-005: This test case aims to verify throwing NotFoundException for very large id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        provider.getUserById(Number.MAX_SAFE_INTEGER),
      ).rejects.toThrow(`User with id ${Number.MAX_SAFE_INTEGER} not found`);
    });
  });

  describe('UC-04: View User Profile (Get By Username)', () => {
    it('TC-VIEWUSERPROFILE-006: This test case aims to verify returning UserDto for existing username', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.getUserByUsername('testuser');

      expect(result).toEqual(new UserDto(mockUser));
    });

    it('TC-VIEWUSERPROFILE-007: This test case aims to verify returning null for non-existent username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-008: This test case aims to verify handling empty string username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.getUserByUsername('');

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-009: This test case aims to verify handling username with special characters', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await provider.getUserByUsername('user_name_123');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'user_name_123' },
      });
    });

    it('TC-VIEWUSERPROFILE-010: This test case aims to verify handling very long username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.getUserByUsername('a'.repeat(255));

      expect(result).toBeNull();
    });
  });

  describe('UC-04: View User Profile (Get By Email)', () => {
    it('TC-VIEWUSERPROFILE-011: This test case aims to verify returning UserDto for existing email', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.getUserByEmail('test@example.com');

      expect(result).toEqual(new UserDto(mockUser));
    });

    it('TC-VIEWUSERPROFILE-012: This test case aims to verify returning null for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-013: This test case aims to verify handling empty string email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.getUserByEmail('');

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-014: This test case aims to verify handling email with subdomain', async () => {
      const mockUser: User = {
        id: 1,
        username: 'testuser',
        email: 'test@mail.example.com',
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.getUserByEmail('test@mail.example.com');

      expect(result).toBeDefined();
    });
  });

  describe('UC-04: View User Profile (Get All Users)', () => {
    it('TC-VIEWUSERPROFILE-015: This test case aims to verify returning array of UserDtos', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          passwordHash: 'hash1',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: true,
          decks: [],
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          passwordHash: 'hash2',
          role: 'ADMIN',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: false,
          decks: [],
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await provider.getAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserDto);
      expect(result[1]).toBeInstanceOf(UserDto);
    });

    it('TC-VIEWUSERPROFILE-016: This test case aims to verify returning empty array when no users exist', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await provider.getAllUsers();

      expect(result).toEqual([]);
    });

    it('TC-VIEWUSERPROFILE-017: This test case aims to verify handling single user', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'onlyuser',
          email: 'only@example.com',
          passwordHash: 'hash',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: true,
          decks: [],
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await provider.getAllUsers();

      expect(result).toHaveLength(1);
    });

    it('TC-VIEWUSERPROFILE-018: This test case aims to verify handling many users', async () => {
      const mockUsers = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@example.com`,
        passwordHash: 'hash',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
        decks: [],
      }));
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await provider.getAllUsers();

      expect(result).toHaveLength(100);
    });
  });

  describe('UC-04: View User Profile (Find All)', () => {
    it('TC-VIEWUSERPROFILE-019: This test case aims to verify returning all users with decks', async () => {
      const mockUsers = [
        {
          id: 1,
          username: 'user1',
          decks: [{ id: 1, title: 'Deck 1' }],
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await provider.findAll();

      expect(result).toEqual(mockUsers);
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        include: { decks: true },
      });
    });

    it('TC-VIEWUSERPROFILE-020: This test case aims to verify returning empty array when no users', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await provider.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('UC-04: View User Profile (Find By Email)', () => {
    it('TC-VIEWUSERPROFILE-021: This test case aims to verify finding user by email', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('TC-VIEWUSERPROFILE-022: This test case aims to verify returning null for non-existent email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-023: This test case aims to verify case-sensitivity for email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await provider.findByEmail('TEST@EXAMPLE.COM');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
      });
    });
  });

  describe('UC-04: View User Profile (Find By Username)', () => {
    it('TC-VIEWUSERPROFILE-024: This test case aims to verify finding user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.findByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('TC-VIEWUSERPROFILE-025: This test case aims to verify returning null for non-existent username', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('UC-04: View User Profile (Find One)', () => {
    it('TC-VIEWUSERPROFILE-026: This test case aims to verify finding user by id with decks and cards', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        decks: [
          {
            id: 1,
            title: 'Deck 1',
            cards: [{ id: 1, front: 'Q1', back: 'A1' }],
          },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.findOne(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          decks: {
            include: {
              cards: true,
            },
          },
        },
      });
    });

    it('TC-VIEWUSERPROFILE-027: This test case aims to verify returning null for non-existent id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await provider.findOne(999);

      expect(result).toBeNull();
    });

    it('TC-VIEWUSERPROFILE-028: This test case aims to verify handling user with no decks', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        decks: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.findOne(1);

      expect((result as unknown as typeof mockUser)?.decks).toEqual([]);
    });

    it('TC-VIEWUSERPROFILE-029: This test case aims to verify handling user with multiple decks and cards', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        decks: [
          { id: 1, cards: [{ id: 1 }, { id: 2 }] },
          { id: 2, cards: [{ id: 3 }] },
        ],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await provider.findOne(1);

      expect((result as unknown as typeof mockUser)?.decks).toHaveLength(2);
    });
  });

  describe('UC-05: Update User Profile', () => {
    const existingUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'USER',
      passwordHash: 'oldhash',
      isEmailConfirmed: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    beforeEach(() => {
      // Setup default mock for findOne (find by id) - returns existing user
      mockPrismaService.user.findUnique.mockImplementation(
        (args: {
          where: { id?: number; email?: string; username?: string };
        }) => {
          if (args.where.id === 1) {
            return Promise.resolve(existingUser);
          }
          // For email/username conflict checks - return null (no conflict)
          return Promise.resolve(null);
        },
      );
    });

    describe('Update username scenarios', () => {
      it('TC-UPDATEPROFILE-009: This test case aims to verify updating only username', async () => {
        const updateDto = { username: 'newusername' };
        const mockUpdated = {
          id: 1,
          username: 'newusername',
          email: 'test@example.com',
        };
        mockPrismaService.user.update.mockResolvedValue(mockUpdated);

        const result = await provider.update(1, updateDto);

        expect(result.username).toBe('newusername');
        expect(prismaService.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: {
            username: 'newusername',
            email: undefined,
            passwordHash: undefined,
            role: undefined,
          },
        });
      });

      it('TC-UPDATEPROFILE-010: This test case aims to verify updating to very short username', async () => {
        const updateDto = { username: 'abc' };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          username: 'abc',
        });

        const result = await provider.update(1, updateDto);

        expect(result.username).toBe('abc');
      });

      it('TC-UPDATEPROFILE-011: This test case aims to verify updating to very long username', async () => {
        const updateDto = { username: 'a'.repeat(100) };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          username: 'a'.repeat(100),
        });

        const result = await provider.update(1, updateDto);

        expect(result.username).toBe('a'.repeat(100));
      });
    });

    describe('Update email scenarios', () => {
      it('TC-UPDATEPROFILE-012: This test case aims to verify updating only email', async () => {
        const updateDto = { email: 'newemail@example.com' };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          email: 'newemail@example.com',
        });

        const result = await provider.update(1, updateDto);

        expect(result.email).toBe('newemail@example.com');
      });

      it('TC-UPDATEPROFILE-013: This test case aims to verify updating to email with subdomain', async () => {
        const updateDto = { email: 'test@mail.example.com' };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          email: 'test@mail.example.com',
        });

        const result = await provider.update(1, updateDto);

        expect(result.email).toBe('test@mail.example.com');
      });
    });

    describe('Update password scenarios', () => {
      it('TC-UPDATEPROFILE-014: This test case aims to verify password hashing when updating', async () => {
        const updateDto = { password: 'newpassword123' };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          passwordHash: 'newhash',
        });

        await provider.update(1, updateDto);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const updateCall = mockPrismaService.user.update.mock.calls[0][0] as {
          data: { passwordHash?: string };
        };
        expect(updateCall.data.passwordHash).toBeDefined();
        expect(updateCall.data.passwordHash).not.toBe('newpassword123');
      });

      it('TC-UPDATEPROFILE-015: This test case aims to verify passwordHash is not set when password not provided', async () => {
        const updateDto = { username: 'newname' };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          username: 'newname',
        });

        await provider.update(1, updateDto);

        expect(mockPrismaService.user.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: expect.objectContaining({
            passwordHash: undefined,
          }) as object,
        });
      });
    });

    describe('Update role scenarios', () => {
      it('TC-UPDATEPROFILE-016: This test case aims to verify updating role to ADMIN', async () => {
        const updateDto = { role: 'ADMIN' as const };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          role: 'ADMIN',
        });

        const result = await provider.update(1, updateDto);

        expect(result.role).toBe('ADMIN');
      });

      it('TC-UPDATEPROFILE-017: This test case aims to verify updating role to USER', async () => {
        const updateDto = { role: 'USER' as const };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          role: 'USER',
        });

        const result = await provider.update(1, updateDto);

        expect(result.role).toBe('USER');
      });
    });

    describe('Update multiple fields scenarios', () => {
      it('TC-UPDATEPROFILE-018: This test case aims to verify updating username and email together', async () => {
        const updateDto = {
          username: 'newname',
          email: 'newemail@example.com',
        };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          ...updateDto,
        });

        const result = await provider.update(1, updateDto);

        expect(result.username).toBe('newname');
        expect(result.email).toBe('newemail@example.com');
      });

      it('TC-UPDATEPROFILE-019: This test case aims to verify updating all fields at once', async () => {
        const updateDto = {
          username: 'newname',
          email: 'newemail@example.com',
          password: 'newpassword123',
          role: 'ADMIN' as const,
        };
        mockPrismaService.user.update.mockResolvedValue({
          id: 1,
          username: 'newname',
          email: 'newemail@example.com',
          role: 'ADMIN',
        });

        const result = await provider.update(1, updateDto);

        expect(result.username).toBe('newname');
        expect(result.email).toBe('newemail@example.com');
        expect(result.role).toBe('ADMIN');
      });
    });

    describe('Error handling scenarios', () => {
      it('TC-UPDATEPROFILE-020: This test case aims to verify error for non-existent user', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        await expect(
          provider.update(999, { username: 'test' }),
        ).rejects.toThrow('User with id 999 not found');
      });

      it('TC-UPDATEPROFILE-021: This test case aims to verify error for email conflict', async () => {
        // First call returns existing user, second call returns conflict user
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(existingUser)
          .mockResolvedValueOnce({ id: 2, email: 'existing@example.com' });

        await expect(
          provider.update(1, { email: 'existing@example.com' }),
        ).rejects.toThrow('Email already in use');
      });

      it('TC-UPDATEPROFILE-022: This test case aims to verify error for username conflict', async () => {
        // First call returns existing user, second call returns conflict user for username check
        mockPrismaService.user.findUnique
          .mockResolvedValueOnce(existingUser)
          .mockResolvedValueOnce({ id: 2, username: 'existinguser' });

        await expect(
          provider.update(1, { username: 'existinguser' }),
        ).rejects.toThrow('Username already in use');
      });
    });
  });

  describe('UC-01: Register (Mark Email Confirmed)', () => {
    it('TC-REGISTER-111: This test case aims to verify marking email as confirmed', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        id: 1,
        isEmailConfirmed: true,
      });

      const result = await provider.markEmailAsConfirmed(1);

      expect(result.isEmailConfirmed).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isEmailConfirmed: true },
      });
    });

    it('TC-REGISTER-112: This test case aims to verify handling already confirmed email', async () => {
      mockPrismaService.user.update.mockResolvedValue({
        id: 1,
        isEmailConfirmed: true,
      });

      const result = await provider.markEmailAsConfirmed(1);

      expect(result.isEmailConfirmed).toBe(true);
    });

    it('TC-REGISTER-113: This test case aims to verify throwing error for non-existent user', async () => {
      mockPrismaService.user.update.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(provider.markEmailAsConfirmed(999)).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('UC-06: Delete User Account', () => {
    it('TC-DELETEACCOUNT-004: This test case aims to verify user deletion by id', async () => {
      const mockDeletedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await provider.remove(1);

      expect(result).toEqual(mockDeletedUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('TC-DELETEACCOUNT-005: This test case aims to verify error for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(provider.remove(999)).rejects.toThrow(
        'User with id 999 not found',
      );
    });

    it('TC-DELETEACCOUNT-006: This test case aims to verify cascade deletion', async () => {
      const mockDeletedUser = {
        id: 1,
        username: 'testuser',
        decks: [{ id: 1 }, { id: 2 }],
      };
      // Mock findOne to return user (for existence check)
      mockPrismaService.user.findUnique.mockResolvedValue(mockDeletedUser);
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await provider.remove(1);

      expect(result).toEqual(mockDeletedUser);
    });
  });

  describe('UC-06: Delete User Account (Remove By Username)', () => {
    it('TC-DELETEACCOUNT-007: This test case aims to verify deleting user by username', async () => {
      const mockDeletedUser = {
        id: 1,
        username: 'testuser',
      };
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await provider.removeByUsername('testuser');

      expect(result).toEqual(mockDeletedUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });

    it('TC-DELETEACCOUNT-008: This test case aims to verify throwing error for non-existent username', async () => {
      mockPrismaService.user.delete.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(provider.removeByUsername('nonexistent')).rejects.toThrow(
        'Record not found',
      );
    });

    it('TC-DELETEACCOUNT-009: This test case aims to verify handling username with special characters', async () => {
      const mockDeletedUser = { id: 1, username: 'user_123' };
      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await provider.removeByUsername('user_123');

      expect(result.username).toBe('user_123');
    });
  });
});
