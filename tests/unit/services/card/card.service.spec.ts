/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from 'src/services/card/card.service';
import { PrismaService } from 'src/services/prisma.service';

describe('Card', () => {
  let provider: CardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    card: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deck: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    provider = module.get<CardService>(CardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('create', () => {
    it('should create a new card', async () => {
      const createCardDto = {
        deckId: 1,
        front: 'What is JavaScript?',
        back: 'A programming language',
        tags: 'programming,js',
      };

      const mockCard = {
        id: 1,
        ...createCardDto,
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDeck = {
        id: 1,
        languageMode: 'VN_EN',
      };

      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
      mockPrismaService.card.create.mockResolvedValue(mockCard);

      const result = await provider.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.create).toHaveBeenCalledWith({
        data: createCardDto,
      });
    });

    it('should create a card without tags', async () => {
      const createCardDto = {
        deckId: 1,
        front: 'What is TypeScript?',
        back: 'A typed superset of JavaScript',
      };

      const mockCard = {
        id: 2,
        ...createCardDto,
        tags: null,
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDeck = {
        id: 1,
        languageMode: 'VN_EN',
      };

      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);
      mockPrismaService.card.create.mockResolvedValue(mockCard);

      const result = await provider.create(createCardDto);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.create).toHaveBeenCalledWith({
        data: createCardDto,
      });
    });
  });

  describe('findAll', () => {
    it('should return all cards with deck and reviews', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          tags: 'tag1',
          examples: null,
          wordType: null,
          pronunciation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deck: {
            id: 1,
            name: 'Deck 1',
            userId: 1,
          },
          reviews: [
            {
              id: 1,
              cardId: 1,
              rating: 4,
              reviewedAt: new Date(),
            },
          ],
        },
        {
          id: 2,
          deckId: 1,
          front: 'Question 2',
          back: 'Answer 2',
          tags: null,
          examples: null,
          wordType: null,
          pronunciation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deck: {
            id: 1,
            name: 'Deck 1',
            userId: 1,
          },
          reviews: [],
        },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findAll();

      expect(result).toEqual(mockCards);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        include: {
          deck: true,
          reviews: true,
        },
      });
    });

    it('should return empty array when no cards exist', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await provider.findAll();

      expect(result).toEqual([]);
      expect(prismaService.card.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should find a card by id with deck, user, and reviews', async () => {
      const mockCard = {
        id: 1,
        deckId: 1,
        front: 'Question 1',
        back: 'Answer 1',
        tags: 'tag1,tag2',
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deck: {
          id: 1,
          name: 'Deck 1',
          userId: 1,
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
        reviews: [
          {
            id: 2,
            cardId: 1,
            rating: 5,
            reviewedAt: new Date('2025-11-10'),
          },
          {
            id: 1,
            cardId: 1,
            rating: 3,
            reviewedAt: new Date('2025-11-09'),
          },
        ],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      const result = await provider.findOne(1);

      expect(result).toEqual(mockCard);
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          deck: {
            include: {
              user: true,
            },
          },
          reviews: {
            orderBy: {
              reviewedAt: 'desc',
            },
          },
        },
      });
    });

    it('should return null when card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      const result = await provider.findOne(999);

      expect(result).toBeNull();
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          deck: {
            include: {
              user: true,
            },
          },
          reviews: {
            orderBy: {
              reviewedAt: 'desc',
            },
          },
        },
      });
    });
  });

  describe('findByDeck', () => {
    it('should find all cards in a deck with latest review', async () => {
      const mockCards = [
        {
          id: 1,
          deckId: 1,
          front: 'Question 1',
          back: 'Answer 1',
          tags: 'tag1',
          examples: null,
          wordType: null,
          pronunciation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [
            {
              id: 1,
              cardId: 1,
              rating: 4,
              reviewedAt: new Date('2025-11-10'),
            },
          ],
        },
        {
          id: 2,
          deckId: 1,
          front: 'Question 2',
          back: 'Answer 2',
          tags: null,
          examples: null,
          wordType: null,
          pronunciation: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          reviews: [],
        },
      ];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.findByDeck(1);

      expect(result).toEqual(mockCards);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
        include: {
          reviews: {
            orderBy: {
              reviewedAt: 'desc',
            },
            take: 1,
          },
        },
      });
    });

    it('should return empty array when deck has no cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await provider.findByDeck(999);

      expect(result).toEqual([]);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        where: { deckId: 999 },
        include: {
          reviews: {
            orderBy: {
              reviewedAt: 'desc',
            },
            take: 1,
          },
        },
      });
    });
  });

  describe('update', () => {
    it('should update all card fields', async () => {
      const updateDto = {
        front: 'Updated question',
        back: 'Updated answer',
        tags: 'updated,tags',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        ...updateDto,
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2025-11-10'),
      };

      mockPrismaService.card.update.mockResolvedValue(mockUpdatedCard);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('should update only front', async () => {
      const updateDto = {
        front: 'New question',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        front: 'New question',
        back: 'Original answer',
        tags: 'original,tags',
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2025-11-10'),
      };

      mockPrismaService.card.update.mockResolvedValue(mockUpdatedCard);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('should update only back', async () => {
      const updateDto = {
        back: 'New answer',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        front: 'Original question',
        back: 'New answer',
        tags: 'original,tags',
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2025-11-10'),
      };

      mockPrismaService.card.update.mockResolvedValue(mockUpdatedCard);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });

    it('should update only tags', async () => {
      const updateDto = {
        tags: 'new,tags',
      };

      const mockUpdatedCard = {
        id: 1,
        deckId: 1,
        front: 'Original question',
        back: 'Original answer',
        tags: 'new,tags',
        examples: null,
        wordType: null,
        pronunciation: null,
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2025-11-10'),
      };

      mockPrismaService.card.update.mockResolvedValue(mockUpdatedCard);

      const result = await provider.update(1, updateDto);

      expect(result).toEqual(mockUpdatedCard);
      expect(prismaService.card.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateDto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a card by id', async () => {
      const mockDeletedCard = {
        id: 1,
        deckId: 1,
        front: 'Question to delete',
        back: 'Answer to delete',
        tags: 'delete',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.card.delete.mockResolvedValue(mockDeletedCard);

      const result = await provider.remove(1);

      expect(result).toEqual(mockDeletedCard);
      expect(prismaService.card.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle deletion of non-existent card', async () => {
      const mockError = new Error('Record not found');
      mockPrismaService.card.delete.mockRejectedValue(mockError);

      await expect(provider.remove(999)).rejects.toThrow('Record not found');
      expect(prismaService.card.delete).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });
});
