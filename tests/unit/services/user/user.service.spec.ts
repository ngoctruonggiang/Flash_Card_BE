/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from 'src/services/user/user.service';
import { PrismaService } from 'src/services/prisma.service';
import { UserDto } from 'src/utils/types/dto/user/user.dto';
import { User } from '@prisma/client';

describe('User', () => {
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

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('Create', () => {
    it('should create a new user', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        lastLoginAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      const result = await provider.create(mockUser);
      expect(result).toEqual(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: mockUser,
      });
    });
  });

  describe('Read', () => {
    describe('findAll / getAll', () => {
      it('should return all users with their decks', async () => {
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
            decks: [{ id: 1, name: 'Deck 1', userId: 1 }],
          },
          {
            id: 2,
            username: 'user2',
            email: 'user2@example.com',
            passwordHash: 'hash2',
            role: 'USER',
            createdAt: new Date(),
            lastLoginAt: new Date(),
            isEmailConfirmed: true,
            decks: [],
          },
        ];

        mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

        const result = await provider.findAll();
        const getResult = await provider.getAllUsers();

        expect(result).toEqual(mockUsers);
        expect(prismaService.user.findMany).toHaveBeenCalledWith({
          include: {
            decks: true,
          },
        });
        expect(getResult).toHaveLength(mockUsers.length);
        expect(getResult).toEqual(
          mockUsers.map(
            (user) => new UserDto({ ...user, decks: undefined } as User),
          ),
        );
      });

      it('should return empty array when no users exist', async () => {
        mockPrismaService.user.findMany.mockResolvedValue([]);

        const result = await provider.findAll();
        const getResult = await provider.getAllUsers();

        expect(result).toEqual([]);
        expect(getResult).toEqual([]);
        expect(prismaService.user.findMany).toHaveBeenCalled();
      });
    });

    describe('findByEmail / getByEmail', () => {
      it('should find a user by email', async () => {
        const mockUser: User = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: true,
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

        const result = await provider.findByEmail('test@example.com');
        const getResult = await provider.getUserByEmail('test@example.com');

        expect(result).toEqual(mockUser);
        expect(getResult).toEqual(new UserDto(mockUser));
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@example.com' },
        });
      });

      it('should return null when user not found by email', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        const result = await provider.findByEmail('nonexistent@example.com');
        const getResult = await provider.getUserByEmail(
          'nonexistent@example.com',
        );

        expect(result).toBeNull();
        expect(getResult).toBeNull();
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { email: 'nonexistent@example.com' },
        });
      });
    });

    describe('findByUsername / getByUsername', () => {
      it('should find a user by username', async () => {
        const mockUser: User = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: true,
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

        const result = await provider.findByUsername('testuser');
        const getResult = await provider.getUserByUsername('testuser');

        expect(result).toEqual(mockUser);
        expect(getResult).toEqual(new UserDto(mockUser));
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { username: 'testuser' },
        });
      });

      it('should return null when user not found by username', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        const result = await provider.findByUsername('nonexistent');
        const getResult = await provider.getUserByUsername('nonexistent');

        expect(result).toBeNull();
        expect(getResult).toBeNull();
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { username: 'nonexistent' },
        });
      });
    });

    describe('findOne / getUserById', () => {
      it('should find a user by id with decks and cards', async () => {
        const mockUser = {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          passwordHash: 'hashedpassword',
          role: 'USER',
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isEmailConfirmed: true,
          decks: [
            {
              id: 1,
              name: 'Deck 1',
              userId: 1,
              cards: [
                { id: 1, question: 'Q1', answer: 'A1', deckId: 1 },
                { id: 2, question: 'Q2', answer: 'A2', deckId: 1 },
              ],
            },
          ],
        };

        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

        const result = await provider.findOne(1);
        const getResult = await provider.getUserById(1);

        expect(result).toEqual(mockUser);
        expect(getResult).toEqual(
          new UserDto({ ...mockUser, decks: undefined } as User),
        );
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

      it('should return null when user not found by id', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(null);

        const result = await provider.findOne(999);
        const getResult = await provider.getUserById(999);

        expect(result).toBeNull();
        expect(getResult).toBeNull();
        expect(prismaService.user.findUnique).toHaveBeenCalledWith({
          where: { id: 999 },
          include: {
            decks: {
              include: {
                cards: true,
              },
            },
          },
        });
      });
    });
  });

  describe('Update', () => {
    it('should update user without password', async () => {
      const updateDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        passwordHash: 'oldhashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: 'updateduser',
          email: 'updated@example.com',
          passwordHash: undefined,
        },
      });
    });

    it('should update user with password hashing', async () => {
      const updateDto = {
        username: 'updateduser',
        email: 'updated@example.com',
        password: 'newpassword123',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        passwordHash: 'newhashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it('should update only username', async () => {
      const updateDto = {
        username: 'newusername',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'newusername',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: 'newusername',
          email: undefined,
          passwordHash: undefined,
        },
      });
    });

    it('should update only email', async () => {
      const updateDto = {
        email: 'newemail@example.com',
      };

      const mockUpdatedUser = {
        id: 1,
        username: 'testuser',
        email: 'newemail@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          username: undefined,
          email: 'newemail@example.com',
          passwordHash: undefined,
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a user by id', async () => {
      const mockDeletedUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        isEmailConfirmed: true,
      };

      mockPrismaService.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await provider.remove(1);

      expect(result).toEqual(mockDeletedUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle deletion of non-existent user', async () => {
      const mockError = new Error('Record not found');
      mockPrismaService.user.delete.mockRejectedValue(mockError);

      await expect(provider.remove(999)).rejects.toThrow('Record not found');
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('markEmailAsConfirmed', () => {
    it('should mark email as confirmed', async () => {
      const mockUser = {
        id: 1,
        isEmailConfirmed: true,
      };
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await provider.markEmailAsConfirmed(1);

      expect(result).toEqual(mockUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isEmailConfirmed: true },
      });
    });
  });

  describe('removeByUsername', () => {
    it('should remove user by username', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
      };
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await provider.removeByUsername('testuser');

      expect(result).toEqual(mockUser);
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });
  });
});
