/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { DeckService } from 'src/services/deck/deck.service';
import { PrismaService } from 'src/services/prisma.service';
import {
  CreateDeckDto,
  LanguageMode,
} from 'src/utils/types/dto/deck/createDeck.dto';
import { ReviewQuality } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { createMockPrismaService } from '../__helpers__';

describe('DeckService Tests', () => {
  let provider: DeckService;
  let prismaService: PrismaService;

  const mockPrismaService = createMockPrismaService();

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UC-08: Create Deck', () => {
    describe('Basic deck creation scenarios', () => {
      it('TC-CREATEDECK-006: This test case aims to verify deck creation with minimum required fields', async () => {
        const createDto: CreateDeckDto = { title: 'Test Deck' };
        const mockDeck = {
          id: 1,
          title: 'Test Deck',
          description: undefined,
          iconName: undefined,
          colorCode: undefined,
          languageMode: 'VN_EN',
          userId: 1,
        };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result).toEqual(mockDeck);
        expect(prismaService.deck.create).toHaveBeenCalledWith({
          data: {
            title: 'Test Deck',
            description: undefined,
            iconName: undefined,
            colorCode: undefined,
            languageMode: 'VN_EN',
            userId: 1,
          },
        });
      });

      it('TC-CREATEDECK-007: This test case aims to verify deck creation with all optional fields', async () => {
        const createDto: CreateDeckDto = {
          title: 'Full Deck',
          description: 'A complete deck',
          iconName: 'book',
          colorCode: '#FF5733',
          languageMode: LanguageMode.BIDIRECTIONAL,
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.title).toBe('Full Deck');
        expect(result.description).toBe('A complete deck');
        expect(result.iconName).toBe('book');
        expect(result.colorCode).toBe('#FF5733');
        expect(result.languageMode).toBe('BIDIRECTIONAL');
      });

      it('TC-CREATEDECK-008: This test case aims to verify deck creation with empty title', async () => {
        const createDto: CreateDeckDto = { title: '' };
        const mockDeck = { id: 1, title: '', userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.title).toBe('');
      });

      it('TC-CREATEDECK-009: This test case aims to verify deck creation with very long title', async () => {
        const longTitle = 'A'.repeat(1000);
        const createDto: CreateDeckDto = { title: longTitle };
        const mockDeck = { id: 1, title: longTitle, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.title.length).toBe(1000);
      });

      it('TC-CREATEDECK-010: This test case aims to verify deck creation with special characters in title', async () => {
        const createDto: CreateDeckDto = {
          title: '日本語 Deck <script>alert("xss")</script> 🎉',
        };
        const mockDeck = { id: 1, title: createDto.title, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.title).toContain('🎉');
        expect(result.title).toContain('<script>');
      });

      it('TC-CREATEDECK-011: This test case aims to verify deck creation with newlines in description', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          description: 'Line 1\nLine 2\nLine 3',
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.description).toContain('\n');
      });
    });

    describe('Language mode variations scenarios', () => {
      it('TC-CREATEDECK-012: This test case aims to verify deck creation with VN_EN language mode', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          languageMode: LanguageMode.VN_EN,
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.languageMode).toBe('VN_EN');
      });

      it('TC-CREATEDECK-013: This test case aims to verify deck creation with EN_VN language mode', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          languageMode: LanguageMode.EN_VN,
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.languageMode).toBe('EN_VN');
      });

      it('TC-CREATEDECK-014: This test case aims to verify deck creation with BIDIRECTIONAL language mode', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          languageMode: LanguageMode.BIDIRECTIONAL,
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.languageMode).toBe('BIDIRECTIONAL');
      });

      it('TC-CREATEDECK-015: This test case aims to verify default VN_EN language mode when not specified', async () => {
        const createDto: CreateDeckDto = { title: 'Test' };
        mockPrismaService.deck.create.mockResolvedValue({
          id: 1,
          title: 'Test',
          languageMode: 'VN_EN',
          userId: 1,
        });

        await provider.create(1, createDto);

        expect(prismaService.deck.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            languageMode: 'VN_EN',
          }) as object,
        });
      });
    });

    describe('User ID variations', () => {
      it('should create deck with user ID 0', async () => {
        const createDto: CreateDeckDto = { title: 'Test' };
        const mockDeck = { id: 1, title: 'Test', userId: 0 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(0, createDto);

        expect(result.userId).toBe(0);
      });

      it('should create deck with large user ID', async () => {
        const createDto: CreateDeckDto = { title: 'Test' };
        const mockDeck = { id: 1, title: 'Test', userId: 999999999 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(999999999, createDto);

        expect(result.userId).toBe(999999999);
      });
    });

    describe('Icon and color code', () => {
      it('should create deck with valid hex color code', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          colorCode: '#FFFFFF',
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.colorCode).toBe('#FFFFFF');
      });

      it('should create deck with lowercase hex color code', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          colorCode: '#ff5733',
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.colorCode).toBe('#ff5733');
      });

      it('should create deck with icon name', async () => {
        const createDto: CreateDeckDto = {
          title: 'Test',
          iconName: 'book-open',
        };
        const mockDeck = { id: 1, ...createDto, userId: 1 };
        mockPrismaService.deck.create.mockResolvedValue(mockDeck);

        const result = await provider.create(1, createDto);

        expect(result.iconName).toBe('book-open');
      });
    });
  });

  describe('findAll', () => {
    it('should return all decks with users and cards', async () => {
      const mockDecks = [
        { id: 1, title: 'Deck 1', user: { id: 1 }, cards: [] },
        {
          id: 2,
          title: 'Deck 2',
          user: { id: 2 },
          cards: [{ id: 1, examples: null }],
        },
      ];
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findAll();

      expect(result).toHaveLength(2);
      expect(prismaService.deck.findMany).toHaveBeenCalledWith({
        include: { user: true, cards: true },
      });
    });

    it('should return empty array when no decks exist', async () => {
      mockPrismaService.deck.findMany.mockResolvedValue([]);

      const result = await provider.findAll();

      expect(result).toEqual([]);
    });

    it('should parse examples JSON for cards', async () => {
      const mockDecks = [
        {
          id: 1,
          title: 'Deck 1',
          user: { id: 1 },
          cards: [
            {
              id: 1,
              examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
            },
          ],
        },
      ];
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findAll();

      expect(result[0].cards[0].examples).toEqual([
        { sentence: 'Ex', translation: 'Tr' },
      ]);
    });

    it('should handle cards with null examples', async () => {
      const mockDecks = [
        {
          id: 1,
          title: 'Deck 1',
          user: { id: 1 },
          cards: [{ id: 1, examples: null }],
        },
      ];
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findAll();

      expect(result[0].cards[0].examples).toBeNull();
    });

    it('should handle many decks', async () => {
      const mockDecks = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Deck ${i + 1}`,
        user: { id: 1 },
        cards: [],
      }));
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findAll();

      expect(result).toHaveLength(100);
    });
  });

  describe('findOne', () => {
    it('should find deck by id with all relations', async () => {
      const mockDeck = {
        id: 1,
        title: 'Test Deck',
        user: { id: 1, username: 'testuser' },
        cards: [{ id: 1, front: 'Q', reviews: [], examples: null }],
      };
      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

      const result = await provider.findOne(1);

      expect(result).toEqual(mockDeck);
      expect(prismaService.deck.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: true,
          cards: { include: { reviews: true } },
        },
      });
    });

    it('should throw NotFoundException for non-existent deck', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(provider.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for id = 0', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(provider.findOne(0)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for negative id', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(provider.findOne(-1)).rejects.toThrow(NotFoundException);
    });

    it('should parse examples JSON for cards', async () => {
      const mockDeck = {
        id: 1,
        title: 'Test',
        user: { id: 1 },
        cards: [
          {
            id: 1,
            examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
            reviews: [],
          },
        ],
      };
      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

      const result = await provider.findOne(1);

      expect(result?.cards[0].examples).toEqual([
        { sentence: 'Ex', translation: 'Tr' },
      ]);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaService.deck.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(provider.findOne(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByUser', () => {
    it('should find all decks by user id', async () => {
      const mockDecks = [
        { id: 1, title: 'Deck 1', userId: 1, cards: [] },
        { id: 2, title: 'Deck 2', userId: 1, cards: [] },
      ];
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findByUser(1);

      expect(result).toHaveLength(2);
      expect(prismaService.deck.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: { cards: true },
      });
    });

    it('should return empty array for user with no decks', async () => {
      mockPrismaService.deck.findMany.mockResolvedValue([]);

      const result = await provider.findByUser(999);

      expect(result).toEqual([]);
    });

    it('should parse examples JSON for cards', async () => {
      const mockDecks = [
        {
          id: 1,
          title: 'Deck 1',
          userId: 1,
          cards: [
            {
              id: 1,
              examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
            },
          ],
        },
      ];
      mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);

      const result = await provider.findByUser(1);

      expect(result[0].cards[0].examples).toEqual([
        { sentence: 'Ex', translation: 'Tr' },
      ]);
    });
  });

  describe('UC-09: Edit Deck', () => {
    beforeEach(() => {
      // Mock deck existence check - update now checks if deck exists first
      mockPrismaService.deck.findUnique.mockResolvedValue({ id: 1, userId: 1 });
    });

    describe('Update individual fields scenarios', () => {
      it('TC-EDITDECK-007: This test case aims to verify updating only title', async () => {
        const mockDeck = { id: 1, title: 'Updated Title' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, { title: 'Updated Title' });

        expect(result.title).toBe('Updated Title');
        expect(prismaService.deck.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { title: 'Updated Title' },
        });
      });

      it('TC-EDITDECK-008: This test case aims to verify updating only description', async () => {
        const mockDeck = { id: 1, description: 'New description' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, {
          description: 'New description',
        });

        expect(result.description).toBe('New description');
      });

      it('TC-EDITDECK-009: This test case aims to verify updating only iconName', async () => {
        const mockDeck = { id: 1, iconName: 'new-icon' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, { iconName: 'new-icon' });

        expect(result.iconName).toBe('new-icon');
      });

      it('TC-EDITDECK-010: This test case aims to verify updating only colorCode', async () => {
        const mockDeck = { id: 1, colorCode: '#000000' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, { colorCode: '#000000' });

        expect(result.colorCode).toBe('#000000');
      });

      it('TC-EDITDECK-011: This test case aims to verify updating only languageMode', async () => {
        const mockDeck = {
          id: 1,
          languageMode: 'BIDIRECTIONAL' as LanguageMode,
        };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, {
          languageMode: 'BIDIRECTIONAL' as LanguageMode,
        });

        expect(result.languageMode).toBe('BIDIRECTIONAL');
      });
    });

    describe('Update multiple fields scenarios', () => {
      it('TC-EDITDECK-012: This test case aims to verify updating title and description together', async () => {
        const mockDeck = { id: 1, title: 'New Title', description: 'New Desc' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, {
          title: 'New Title',
          description: 'New Desc',
        });

        expect(result.title).toBe('New Title');
        expect(result.description).toBe('New Desc');
      });

      it('TC-EDITDECK-013: This test case aims to verify updating all fields at once', async () => {
        const updateData = {
          title: 'New Title',
          description: 'New Desc',
          iconName: 'new-icon',
          colorCode: '#123456',
          languageMode: 'EN_VN' as LanguageMode,
        };
        const mockDeck = { id: 1, ...updateData };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, updateData);

        expect(result.title).toBe('New Title');
        expect(result.languageMode).toBe('EN_VN');
      });
    });

    describe('Error handling scenarios', () => {
      it('TC-EDITDECK-014: This test case aims to verify NotFoundException for non-existent deck', async () => {
        mockPrismaService.deck.findUnique.mockResolvedValue(null);

        await expect(provider.update(999, { title: 'Test' })).rejects.toThrow(
          NotFoundException,
        );
      });

      it('TC-EDITDECK-015: This test case aims to verify handling of empty update data', async () => {
        const mockDeck = { id: 1, title: 'Unchanged' };
        mockPrismaService.deck.update.mockResolvedValue(mockDeck);

        const result = await provider.update(1, {});

        expect(result).toEqual(mockDeck);
      });
    });
  });

  describe('UC-10: Delete Deck', () => {
    beforeEach(() => {
      // Mock deck existence check - remove now checks if deck exists first
      mockPrismaService.deck.findUnique.mockResolvedValue({ id: 1, userId: 1 });
    });

    it('TC-DELETEDECK-004: This test case aims to verify deck deletion and cascade of related data', async () => {
      const mockCards = [{ id: 1 }, { id: 2 }];
      const mockDeck = { id: 1, title: 'Deleted Deck' };

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
      expect(prismaService.cardReview.deleteMany).toHaveBeenCalledWith({
        where: { cardId: { in: [1, 2] } },
      });
      expect(prismaService.card.deleteMany).toHaveBeenCalledWith({
        where: { deckId: 1 },
      });
      expect(prismaService.deck.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('TC-DELETEDECK-005: This test case aims to verify deck deletion with no cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);
      mockPrismaService.card.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.deck.delete.mockResolvedValue({ id: 1 });

      await provider.remove(1);

      expect(prismaService.cardReview.deleteMany).not.toHaveBeenCalled();
    });

    it('TC-DELETEDECK-006: This test case aims to verify NotFoundException for non-existent deck', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(provider.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getReviewedCardsCountInDay', () => {
    it('should return reviewed cards count', async () => {
      const date = new Date('2025-12-01');
      const mockDeck = {
        id: 1,
        cards: [
          { id: 1, reviews: [{ id: 1 }] },
          { id: 2, reviews: [{ id: 2 }] },
          { id: 3, reviews: [] },
        ],
      };
      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

      const result = await provider.getReviewedCardsCountInDay(1, date);

      expect(result).toEqual({
        deckId: 1,
        date: '2025-12-01',
        reviewedCount: 2,
        totalCards: 3,
      });
    });

    it('should return zero when no cards reviewed', async () => {
      const date = new Date('2025-12-01');
      const mockDeck = {
        id: 1,
        cards: [
          { id: 1, reviews: [] },
          { id: 2, reviews: [] },
        ],
      };
      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

      const result = await provider.getReviewedCardsCountInDay(1, date);

      expect(result.reviewedCount).toBe(0);
      expect(result.totalCards).toBe(2);
    });

    it('should return zero when deck has no cards', async () => {
      const date = new Date('2025-12-01');
      const mockDeck = { id: 1, cards: [] };
      mockPrismaService.deck.findUnique.mockResolvedValue(mockDeck);

      const result = await provider.getReviewedCardsCountInDay(1, date);

      expect(result.reviewedCount).toBe(0);
      expect(result.totalCards).toBe(0);
    });

    it('should throw error for non-existent deck', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(
        provider.getReviewedCardsCountInDay(999, new Date()),
      ).rejects.toThrow('Deck with id 999 not found');
    });

    it('should use correct date range for filtering', async () => {
      const date = new Date('2025-12-01T12:00:00.000Z');
      mockPrismaService.deck.findUnique.mockResolvedValue({ id: 1, cards: [] });

      await provider.getReviewedCardsCountInDay(1, date);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const call = mockPrismaService.deck.findUnique.mock.calls[0][0] as {
        include: {
          cards: {
            include: {
              reviews: { where: { reviewedAt: { gte: Date; lte: Date } } };
            };
          };
        };
      };
      const reviewsWhere = call.include.cards.include.reviews.where;
      expect(reviewsWhere.reviewedAt.gte).toBeDefined();
      expect(reviewsWhere.reviewedAt.lte).toBeDefined();
    });
  });

  describe('getCardsDueToday', () => {
    it('should return cards due today', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000); // Yesterday
      const mockCards = [
        { id: 1, reviews: [{ nextReviewDate: pastDate }], examples: null },
        { id: 2, reviews: [], examples: null }, // New card - no reviews
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.getCardsDueToday(1);

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no cards due', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await provider.getCardsDueToday(1);

      expect(result).toEqual([]);
    });

    it('should sort cards - never reviewed first', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 86400000);
      const mockCards = [
        { id: 1, reviews: [{ nextReviewDate: pastDate }], examples: null },
        { id: 2, reviews: [], examples: null },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.getCardsDueToday(1);

      expect(result[0].id).toBe(2); // Never reviewed comes first
      expect(result[1].id).toBe(1);
    });

    it('should parse examples JSON', async () => {
      const mockCards = [
        {
          id: 1,
          reviews: [],
          examples: JSON.stringify([{ sentence: 'Ex', translation: 'Tr' }]),
        },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.getCardsDueToday(1);

      expect(result[0].examples).toEqual([
        { sentence: 'Ex', translation: 'Tr' },
      ]);
    });

    it('should include nextReviewDate in result', async () => {
      const nextReviewDate = new Date('2025-12-01');
      const mockCards = [
        { id: 1, reviews: [{ nextReviewDate }], examples: null },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await provider.getCardsDueToday(1);

      expect(result[0].nextReviewDate).toEqual(nextReviewDate);
    });
  });

  describe('UC-11: View Deck Statistics', () => {
    it('TC-DECKSTATS-004: This test case aims to verify statistics with all quality types', async () => {
      const mockReviews = [
        { quality: ReviewQuality.Again },
        { quality: ReviewQuality.Hard },
        { quality: ReviewQuality.Good },
        { quality: ReviewQuality.Easy },
        { quality: ReviewQuality.Good },
      ];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result).toEqual({
        totalReviews: 5,
        correctReviews: 4, // Hard + Good + Easy
        correctPercentage: 80.0,
        againCount: 1,
        hardCount: 1,
        goodCount: 2,
        easyCount: 1,
      });
    });

    it('should return zero statistics when no reviews', async () => {
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

    it('should return 100% when all reviews are correct', async () => {
      const mockReviews = [
        { quality: ReviewQuality.Good },
        { quality: ReviewQuality.Easy },
        { quality: ReviewQuality.Hard },
      ];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result.correctPercentage).toBe(100);
    });

    it('should return 0% when all reviews are Again', async () => {
      const mockReviews = [
        { quality: ReviewQuality.Again },
        { quality: ReviewQuality.Again },
      ];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result.correctPercentage).toBe(0);
      expect(result.correctReviews).toBe(0);
    });

    it('should handle only Again reviews', async () => {
      const mockReviews = [{ quality: ReviewQuality.Again }];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result.againCount).toBe(1);
      expect(result.hardCount).toBe(0);
      expect(result.goodCount).toBe(0);
      expect(result.easyCount).toBe(0);
    });

    it('should handle only Easy reviews', async () => {
      const mockReviews = [
        { quality: ReviewQuality.Easy },
        { quality: ReviewQuality.Easy },
      ];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result.easyCount).toBe(2);
      expect(result.correctPercentage).toBe(100);
    });

    it('should round percentage to 2 decimal places', async () => {
      const mockReviews = [
        { quality: ReviewQuality.Again },
        { quality: ReviewQuality.Good },
        { quality: ReviewQuality.Good },
      ];
      mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

      const result = await provider.getDeckStatistics(1);

      expect(result.correctPercentage).toBe(66.67);
    });
  });

  describe('UC-12: View Advanced Deck Statistics', () => {
    beforeEach(() => {
      // Mock deck existence check
      mockPrismaService.deck.findUnique.mockResolvedValue({ id: 1 });
    });

    it('should return last studied date', async () => {
      const lastStudied = new Date('2025-12-01T10:30:00.000Z');
      mockPrismaService.cardReview.findFirst.mockResolvedValue({
        reviewedAt: lastStudied,
      });

      const result = await provider.getLastStudiedDate(1);

      expect(result).toEqual({
        deckId: 1,
        lastStudied: lastStudied,
      });
    });

    it('should return null when never studied', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      const result = await provider.getLastStudiedDate(1);

      expect(result).toEqual({
        deckId: 1,
        lastStudied: null,
      });
    });

    it('should query for most recent review', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      await provider.getLastStudiedDate(1);

      expect(prismaService.cardReview.findFirst).toHaveBeenCalledWith({
        where: { card: { deckId: 1 } },
        orderBy: { reviewedAt: 'desc' },
        select: { reviewedAt: true },
      });
    });

    it('should throw NotFoundException for non-existent deck', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(provider.getLastStudiedDate(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
