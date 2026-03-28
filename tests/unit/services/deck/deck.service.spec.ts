/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckService } from 'src/services/deck/deck.service';
import { PrismaService } from 'src/services/prisma.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';
import { ReviewQuality } from '@prisma/client';

describe('Deck', () => {
  let provider: DeckService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deck: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    cardReview: {
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeckService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    provider = module.get<DeckService>(DeckService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('Create', () => {
    it('should create a new deck', async () => {
      const userId = 1;
      const mockDeck: CreateDeckDto = {
        title: 'Test Deck',
        description: 'Test Description',
      };
      const mockCreatedDeck = {
        id: 1,
        title: 'Test Deck',
        description: 'Test Description',
        iconName: undefined,
        colorCode: undefined,
        languageMode: 'VN_EN',
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.deck.create.mockResolvedValue(mockCreatedDeck);
      const result = await provider.create(userId, mockDeck);
      expect(result).not.toBeNull();
      expect(prismaService.deck.create).toHaveBeenCalledWith({
        data: {
          title: mockDeck.title,
          description: mockDeck.description,
          iconName: undefined,
          colorCode: undefined,
          languageMode: 'VN_EN',
          userId: userId,
        },
      });
    });
  });

  describe('Remove', () => {
    it('should remove a deck', async () => {
      const mockDeck = { id: 1, name: 'Test Deck', userId: 1 };
      const mockCards = [{ id: 1 }, { id: 2 }];

      mockPrismaService.card.findMany.mockResolvedValue(mockCards);
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.card.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.deck.delete.mockResolvedValue(mockDeck);
      const result = await provider.remove(1);
      expect(result).toEqual(mockDeck);
      expect(prismaService.card.findMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
        select: { id: true },
      });
      expect(prismaService.card.deleteMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
      });
      expect(prismaService.deck.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('Update', () => {
    it('should update a deck', async () => {
      const mockDeck = { id: 1, name: 'Updated Deck', userId: 1 };

      mockPrismaService.deck.update.mockResolvedValue(mockDeck);
      const result = await provider.update(1, { title: 'Updated Deck' });

      expect(result).toEqual(mockDeck);
      expect(prismaService.deck.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { title: 'Updated Deck' },
      });
    });

    it('should throw an error if deck not found', async () => {
      mockPrismaService.deck.update.mockRejectedValue(
        new Error('Deck not found'),
      );
      await expect(
        provider.update(999, { title: 'Non-existent Deck' }),
      ).rejects.toThrow('Deck not found');
      expect(prismaService.deck.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: { title: 'Non-existent Deck' },
      });
    });
  });

  describe('Query', () => {
    describe('findAll', () => {
      it('should return all decks', async () => {
        const mockDecks = [
          { id: 1, name: 'Deck 1', userId: 1, cards: [] },
          { id: 2, name: 'Deck 2', userId: 1, cards: [] },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

        const result = await provider.findAll();

        expect(result).toEqual(mockDecks);
        expect(prismaService.deck.findMany).toHaveBeenCalledWith({
          include: {
            user: true,
            cards: true,
          },
        });
      });
    });

    describe('findByUser', () => {
      it('should return decks by userId', async () => {
        const mockDecks = [
          { id: 1, name: 'Deck 1', userId: 1, cards: [] },
          { id: 2, name: 'Deck 2', userId: 1, cards: [] },
        ];
        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

        const result = await provider.findByUser(1);

        expect(result).toEqual(mockDecks);
        expect(prismaService.deck.findMany).toHaveBeenCalledWith({
          where: { userId: 1 },
          include: {
            cards: true,
          },
        });
      });
    });

    describe('findOne', () => {
      it('should return a single deck by id', async () => {
        const mockDeck = { id: 1, name: 'Deck 1', userId: 1, cards: [] };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

        const result = await provider.findOne(1);

        expect(result).toEqual(mockDeck);
        expect(prismaService.deck.findUnique).toHaveBeenCalledWith({
          where: { id: 1 },
          include: {
            user: true,
            cards: {
              include: {
                reviews: true,
              },
            },
          },
        });
      });

      it('should return null if deck not found', async () => {
        mockPrismaService.deck.findUnique.mockResolvedValue(null);

        const result = await provider.findOne(999);

        expect(result).toBeNull();
        expect(prismaService.deck.findUnique).toHaveBeenCalledWith({
          where: { id: 999 },
          include: {
            user: true,
            cards: {
              include: {
                reviews: true,
              },
            },
          },
        });
      });
    });
  });

  describe('Statistics', () => {
    describe('getReviewedCardsCountInDay', () => {
      it('should return count of reviewed cards in a day', async () => {
        const date = new Date('2025-11-28');
        const mockDeck = {
          id: 1,
          cards: [
            { id: 1, reviews: [{ id: 1 }] },
            { id: 2, reviews: [] },
          ],
        };

        mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

        const result = await provider.getReviewedCardsCountInDay(1, date);

        expect(result).toEqual({
          deckId: 1,
          date: '2025-11-28',
          reviewedCount: 1,
          totalCards: 2,
        });
      });

      it('should throw error if deck not found', async () => {
        mockPrismaService.deck.findUnique.mockResolvedValue(null);
        await expect(
          provider.getReviewedCardsCountInDay(999, new Date()),
        ).rejects.toThrow('Deck with id 999 not found');
      });
    });

    describe('getCardsDueToday', () => {
      it('should return cards due today', async () => {
        const mockCards = [
          {
            id: 1,
            reviews: [{ nextReviewDate: new Date('2025-11-27') }],
            examples: null,
          },
          {
            id: 2,
            reviews: [], // New card
            examples: null,
          },
        ];

        mockPrismaService.card.findMany.mockResolvedValue(mockCards);

        const result = await provider.getCardsDueToday(1);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(2);
        expect(result[1].id).toBe(1);
      });
    });

    describe('getDeckStatistics', () => {
      it('should return deck statistics', async () => {
        const mockReviews = [
          { quality: ReviewQuality.Good },
          { quality: ReviewQuality.Hard },
          { quality: ReviewQuality.Again },
          { quality: ReviewQuality.Easy },
        ];

        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await provider.getDeckStatistics(1);

        expect(result).toEqual({
          totalReviews: 4,
          correctReviews: 3,
          correctPercentage: 75.0,
          againCount: 1,
          hardCount: 1,
          goodCount: 1,
          easyCount: 1,
        });
      });

      it('should handle zero reviews', async () => {
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await provider.getDeckStatistics(1);

        expect(result).toEqual({
          totalReviews: 0,
          correctReviews: 0,
          correctPercentage: 0,
          againCount: 0,
          hardCount: 0,
          goodCount: 0,
          easyCount: 0,
        });
      });
    });

    describe('getLastStudiedDate', () => {
      it('should return last studied date', async () => {
        const date = new Date();
        mockPrismaService.cardReview.findFirst.mockResolvedValue({
          reviewedAt: date,
        });

        const result = await provider.getLastStudiedDate(1);

        expect(result).toEqual({
          deckId: 1,
          lastStudiedAt: date,
        });
      });

      it('should return null if never studied', async () => {
        mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

        const result = await provider.getLastStudiedDate(1);

        expect(result).toEqual({
          deckId: 1,
          lastStudiedAt: null,
        });
      });
    });
  });
});
