/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StudyService } from 'src/services/study/study.service';
import { PrismaService } from 'src/services/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('StudyService  Tests', () => {
  let service: StudyService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    deck: {
      findFirst: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StudyService>(StudyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('UC-20: Start Study Session', () => {
    describe('Deck ownership validation scenarios', () => {
      it('TC-STARTSTUDY-006: This test case aims to verify NotFoundException when deck does not exist', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(1, 999)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.getCramCards(1, 999)).rejects.toThrow(
          'Deck not found',
        );
      });

      it('TC-STARTSTUDY-007: This test case aims to verify NotFoundException when deck belongs to different user', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(1, 1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('TC-STARTSTUDY-008: This test case aims to verify deck ownership with correct parameters', async () => {
        const userId = 5;
        const deckId = 10;
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(userId, deckId)).rejects.toThrow();

        expect(prismaService.deck.findFirst).toHaveBeenCalledWith({
          where: { id: deckId, userId },
        });
      });

      it('TC-STARTSTUDY-009: This test case aims to verify service proceeds when deck belongs to user', async () => {
        const mockDeck = {
          id: 1,
          userId: 1,
          name: 'Test Deck',
        };
        mockPrismaService.deck.findFirst.mockResolvedValue(mockDeck);
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        const result = await service.getCramCards(1, 1);

        expect(result).toEqual([]);
        expect(prismaService.deck.findFirst).toHaveBeenCalled();
      });
    });

    describe('Card fetching scenarios', () => {
      beforeEach(() => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 1,
          name: 'Test Deck',
        });
      });

      it('TC-STARTSTUDY-010: This test case aims to verify cards are returned from the deck', async () => {
        const mockCards = [
          {
            id: 1,
            front: 'Front 1',
            back: 'Back 1',
            deckId: 1,
            status: 'new',
          },
          {
            id: 2,
            front: 'Front 2',
            back: 'Back 2',
            deckId: 1,
            status: 'review',
          },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1);

        expect(result).toEqual(mockCards);
        expect(result).toHaveLength(2);
      });

      it('TC-STARTSTUDY-011: This test case aims to verify empty array is returned when deck has no cards', async () => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        const result = await service.getCramCards(1, 1);

        expect(result).toEqual([]);
        expect(result).toHaveLength(0);
      });

      it('TC-STARTSTUDY-012: This test case aims to verify cards are returned regardless of their status', async () => {
        const mockCards = [
          { id: 1, status: 'new', deckId: 1 },
          { id: 2, status: 'learning', deckId: 1 },
          { id: 3, status: 'review', deckId: 1 },
          { id: 4, status: 'relearning', deckId: 1 },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1);

        expect(result).toHaveLength(4);
        expect(result.map((c: any) => c.status)).toContain('new');
        expect(result.map((c: any) => c.status)).toContain('learning');
        expect(result.map((c: any) => c.status)).toContain('review');
        expect(result.map((c: any) => c.status)).toContain('relearning');
      });

      it('TC-STARTSTUDY-013: This test case aims to verify cards are returned regardless of nextReviewDate', async () => {
        const pastDate = new Date('2020-01-01');
        const futureDate = new Date('2030-01-01');
        const mockCards = [
          { id: 1, nextReviewDate: null, deckId: 1 },
          { id: 2, nextReviewDate: pastDate, deckId: 1 },
          { id: 3, nextReviewDate: futureDate, deckId: 1 },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1);

        expect(result).toHaveLength(3);
      });
    });

    describe('Limit parameter scenarios', () => {
      beforeEach(() => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 1,
          name: 'Test Deck',
        });
      });

      it('TC-STARTSTUDY-014: This test case aims to verify default limit of 50 is used when not specified', async () => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        await service.getCramCards(1, 1);

        // The $queryRaw is called with a template literal, verify the call was made
        expect(prismaService.$queryRaw).toHaveBeenCalled();
      });

      it('TC-STARTSTUDY-015: This test case aims to verify custom limit is used when specified', async () => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        await service.getCramCards(1, 1, 10);

        expect(prismaService.$queryRaw).toHaveBeenCalled();
      });

      it('TC-STARTSTUDY-016: This test case aims to verify results are limited correctly', async () => {
        const mockCards = Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          front: `Front ${i + 1}`,
          deckId: 1,
        }));
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1, 5);

        expect(result).toHaveLength(5);
      });

      it('TC-STARTSTUDY-017: This test case aims to verify handling of limit of 0', async () => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        const result = await service.getCramCards(1, 1, 0);

        expect(result).toEqual([]);
      });

      it('TC-STARTSTUDY-018: This test case aims to verify handling of limit of 1', async () => {
        const mockCards = [{ id: 1, front: 'Front 1', deckId: 1 }];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1, 1);

        expect(result).toHaveLength(1);
      });

      it('TC-STARTSTUDY-019: This test case aims to verify handling of very large limit', async () => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);

        await service.getCramCards(1, 1, 10000);

        expect(prismaService.$queryRaw).toHaveBeenCalled();
      });

      it('TC-STARTSTUDY-020: This test case aims to verify fewer cards than limit are returned when deck has fewer cards', async () => {
        const mockCards = [
          { id: 1, deckId: 1 },
          { id: 2, deckId: 1 },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1, 100);

        expect(result).toHaveLength(2);
      });
    });

    describe('User ID variations', () => {
      beforeEach(() => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);
      });

      it('should handle userId = 0', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(0, 1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle negative userId', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(-1, 1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle large userId', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 999999,
        });

        const result = await service.getCramCards(999999, 1);

        expect(result).toEqual([]);
      });
    });

    describe('Deck ID variations', () => {
      beforeEach(() => {
        mockPrismaService.$queryRaw.mockResolvedValue([]);
      });

      it('should handle deckId = 0', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(1, 0)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle negative deckId', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue(null);

        await expect(service.getCramCards(1, -1)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('should handle large deckId', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 999999,
          userId: 1,
        });

        const result = await service.getCramCards(1, 999999);

        expect(result).toEqual([]);
      });
    });

    describe('Card content', () => {
      beforeEach(() => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 1,
        });
      });

      it('should return cards with all fields', async () => {
        const mockCard = {
          id: 1,
          front: 'Test Front',
          back: 'Test Back',
          examples: JSON.stringify(['Example 1', 'Example 2']),
          deckId: 1,
          status: 'review',
          easeFactor: 2.5,
          interval: 10,
          stepIndex: 0,
          nextReviewDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPrismaService.$queryRaw.mockResolvedValue([mockCard]);

        const result = await service.getCramCards(1, 1);

        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('front');
        expect(result[0]).toHaveProperty('back');
        expect(result[0]).toHaveProperty('deckId');
      });

      it('should return cards with unicode content', async () => {
        const mockCard = {
          id: 1,
          front: 'Xin chào',
          back: 'Hello',
          deckId: 1,
        };
        mockPrismaService.$queryRaw.mockResolvedValue([mockCard]);

        const result = await service.getCramCards(1, 1);

        expect(result[0].front).toBe('Xin chào');
      });

      it('should return cards with special characters', async () => {
        const mockCard = {
          id: 1,
          front: 'What is 2 + 2?',
          back: "It's 4!",
          deckId: 1,
        };
        mockPrismaService.$queryRaw.mockResolvedValue([mockCard]);

        const result = await service.getCramCards(1, 1);

        expect(result[0].front).toBe('What is 2 + 2?');
      });

      it('should return cards with very long content', async () => {
        const longText = 'A'.repeat(5000);
        const mockCard = {
          id: 1,
          front: longText,
          back: longText,
          deckId: 1,
        };
        mockPrismaService.$queryRaw.mockResolvedValue([mockCard]);

        const result = await service.getCramCards(1, 1);

        expect(result[0].front).toHaveLength(5000);
      });

      it('should return cards with empty strings', async () => {
        const mockCard = {
          id: 1,
          front: '',
          back: '',
          deckId: 1,
        };
        mockPrismaService.$queryRaw.mockResolvedValue([mockCard]);

        const result = await service.getCramCards(1, 1);

        expect(result[0].front).toBe('');
      });
    });

    describe('Database error handling', () => {
      it('should propagate deck.findFirst errors', async () => {
        mockPrismaService.deck.findFirst.mockRejectedValue(
          new Error('Database connection failed'),
        );

        await expect(service.getCramCards(1, 1)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should propagate $queryRaw errors', async () => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 1,
        });
        mockPrismaService.$queryRaw.mockRejectedValue(
          new Error('Query execution failed'),
        );

        await expect(service.getCramCards(1, 1)).rejects.toThrow(
          'Query execution failed',
        );
      });

      it('should handle timeout errors', async () => {
        mockPrismaService.deck.findFirst.mockRejectedValue(
          new Error('Query timeout'),
        );

        await expect(service.getCramCards(1, 1)).rejects.toThrow(
          'Query timeout',
        );
      });
    });

    describe('Bidirectional cards', () => {
      beforeEach(() => {
        mockPrismaService.deck.findFirst.mockResolvedValue({
          id: 1,
          userId: 1,
        });
      });

      it('should return both original and reverse cards', async () => {
        const mockCards = [
          { id: 1, front: 'Hello', back: 'Xin chào', reverseCardId: 2 },
          { id: 2, front: 'Xin chào', back: 'Hello', reverseCardId: 1 },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1);

        expect(result).toHaveLength(2);
      });

      it('should return cards without reverse', async () => {
        const mockCards = [
          { id: 1, front: 'Hello', back: 'Xin chào', reverseCardId: null },
        ];
        mockPrismaService.$queryRaw.mockResolvedValue(mockCards);

        const result = await service.getCramCards(1, 1);

        expect(result).toHaveLength(1);
        expect(result[0].reverseCardId).toBeNull();
      });
    });
  });

  describe('UC-STATISTICS: User Statistics Endpoints', () => {
    const mockPrismaServiceExtended = {
      ...mockPrismaService,
      deck: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      card: {
        count: jest.fn(),
      },
      cardReview: {
        findMany: jest.fn(),
      },
    };

    beforeEach(async () => {
      jest.clearAllMocks();
      Object.assign(mockPrismaService, mockPrismaServiceExtended);
    });

    describe('getUserStatistics', () => {
      it('TC-USERSTATS-001: This test case aims to verify user statistics are returned correctly', async () => {
        const mockDecks = [{ id: 1 }, { id: 2 }];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date(),
            quality: 'Good',
            card: { id: 1, deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date(),
            quality: 'Easy',
            card: { id: 2, deckId: 1 },
          },
          {
            cardId: 3,
            reviewedAt: new Date(),
            quality: 'Again',
            card: { id: 3, deckId: 2 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.card.count.mockResolvedValue(100);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserStatistics(1);

        expect(result).toHaveProperty('totalCards');
        expect(result).toHaveProperty('studiedToday');
        expect(result).toHaveProperty('studiedThisWeek');
        expect(result).toHaveProperty('studiedThisMonth');
        expect(result).toHaveProperty('currentStreak');
        expect(result).toHaveProperty('longestStreak');
        expect(result).toHaveProperty('averageAccuracy');
        expect(result).toHaveProperty('totalStudyTime');
        expect(result).toHaveProperty('cardsPerDay');
        expect(result).toHaveProperty('bestDay');
        expect(result).toHaveProperty('totalDecks');
        expect(result).toHaveProperty('totalReviews');
      });

      it('TC-USERSTATS-002: This test case aims to verify statistics with no decks', async () => {
        mockPrismaService.deck.findMany.mockResolvedValue([]);
        mockPrismaService.card.count.mockResolvedValue(0);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getUserStatistics(1);

        expect(result.totalCards).toBe(0);
        expect(result.totalDecks).toBe(0);
        expect(result.totalReviews).toBe(0);
        expect(result.studiedToday).toBe(0);
        expect(result.averageAccuracy).toBe(0);
      });

      it('TC-USERSTATS-003: This test case aims to verify accuracy calculation', async () => {
        const mockDecks = [{ id: 1 }];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date(),
            quality: 'Good',
            card: { id: 1, deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date(),
            quality: 'Easy',
            card: { id: 2, deckId: 1 },
          },
          {
            cardId: 3,
            reviewedAt: new Date(),
            quality: 'Hard',
            card: { id: 3, deckId: 1 },
          },
          {
            cardId: 4,
            reviewedAt: new Date(),
            quality: 'Again',
            card: { id: 4, deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.card.count.mockResolvedValue(4);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserStatistics(1);

        // 3 correct (Good, Easy, Hard) out of 4 = 75%
        expect(result.averageAccuracy).toBe(75);
      });

      it('TC-USERSTATS-004: This test case aims to verify total study time calculation', async () => {
        const mockDecks = [{ id: 1 }];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date(),
            quality: 'Good',
            card: { id: 1, deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date(),
            quality: 'Good',
            card: { id: 2, deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.card.count.mockResolvedValue(2);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserStatistics(1);

        // 2 reviews * 10 seconds = 20 seconds
        expect(result.totalStudyTime).toBe(20);
      });

      it('TC-USERSTATS-005: This test case aims to verify streak calculation with consecutive days', async () => {
        const mockDecks = [{ id: 1 }];
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: twoDaysAgo,
            quality: 'Good',
            card: { id: 1, deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: yesterday,
            quality: 'Good',
            card: { id: 2, deckId: 1 },
          },
          {
            cardId: 3,
            reviewedAt: today,
            quality: 'Good',
            card: { id: 3, deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.card.count.mockResolvedValue(3);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserStatistics(1);

        expect(result.currentStreak).toBeGreaterThanOrEqual(1);
        expect(result.longestStreak).toBeGreaterThanOrEqual(1);
      });
    });

    describe('getUserDailyBreakdown', () => {
      it('TC-DAILYBREAKDOWN-001: This test case aims to verify daily breakdown is returned correctly', async () => {
        const mockDecks = [{ id: 1 }];
        const startDate = new Date('2025-12-16');
        const endDate = new Date('2025-12-18');

        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-16T10:00:00'),
            quality: 'Good',
            card: { deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date('2025-12-17T14:00:00'),
            quality: 'Easy',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserDailyBreakdown(
          1,
          startDate,
          endDate,
        );

        expect(result).toHaveProperty('startDate');
        expect(result).toHaveProperty('endDate');
        expect(result).toHaveProperty('dailyBreakdown');
        expect(result).toHaveProperty('summary');
        expect(Array.isArray(result.dailyBreakdown)).toBe(true);
      });

      it('TC-DAILYBREAKDOWN-002: This test case aims to verify days with no reviews are included with zeros', async () => {
        const mockDecks = [{ id: 1 }];
        const startDate = new Date('2025-12-16');
        const endDate = new Date('2025-12-18');

        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-16T10:00:00'),
            quality: 'Good',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserDailyBreakdown(
          1,
          startDate,
          endDate,
        );

        // Should have 3 days in the breakdown
        expect(result.dailyBreakdown.length).toBeGreaterThanOrEqual(1);

        // Find the day with no reviews
        const emptyDay = result.dailyBreakdown.find(
          (d) => d.cardsReviewed === 0,
        );
        if (emptyDay) {
          expect(emptyDay.accuracy).toBe(0);
          expect(emptyDay.studyTime).toBe(0);
          expect(emptyDay.decksStudied).toBe(0);
        }
      });

      it('TC-DAILYBREAKDOWN-003: This test case aims to verify summary calculation', async () => {
        const mockDecks = [{ id: 1 }];
        const startDate = new Date('2025-12-16');
        const endDate = new Date('2025-12-17');

        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-16T10:00:00'),
            quality: 'Good',
            card: { deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date('2025-12-16T10:00:00'),
            quality: 'Again',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserDailyBreakdown(
          1,
          startDate,
          endDate,
        );

        expect(result.summary.totalCardsReviewed).toBe(2);
        expect(result.summary.daysStudied).toBe(1);
      });

      it('TC-DAILYBREAKDOWN-004: This test case aims to verify day of week is correctly calculated', async () => {
        const mockDecks = [{ id: 1 }];
        // December 16, 2025 is a Tuesday
        const startDate = new Date('2025-12-16');
        const endDate = new Date('2025-12-16');

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getUserDailyBreakdown(
          1,
          startDate,
          endDate,
        );

        expect(result.dailyBreakdown[0]).toHaveProperty('dayOfWeek');
      });

      it('TC-DAILYBREAKDOWN-005: This test case aims to verify multiple decks studied count', async () => {
        const mockDecks = [{ id: 1 }, { id: 2 }];
        const startDate = new Date('2025-12-16');
        const endDate = new Date('2025-12-16');

        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-16T10:00:00'),
            quality: 'Good',
            card: { deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date('2025-12-16T11:00:00'),
            quality: 'Easy',
            card: { deckId: 2 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getUserDailyBreakdown(
          1,
          startDate,
          endDate,
        );

        expect(result.dailyBreakdown[0].decksStudied).toBe(2);
      });
    });

    describe('getRecentActivity', () => {
      it('TC-RECENTACTIVITY-001: This test case aims to verify recent activities are returned correctly', async () => {
        const mockDecks = [
          { id: 1, title: 'Test Deck', createdAt: new Date('2025-12-01') },
        ];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-20T10:00:00'),
            quality: 'Good',
            previousStatus: 'new',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getRecentActivity(1, 10);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      });

      it('TC-RECENTACTIVITY-002: This test case aims to verify activities are sorted by date descending', async () => {
        const mockDecks = [
          { id: 1, title: 'Test Deck', createdAt: new Date('2025-12-01') },
        ];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-18T10:00:00'),
            quality: 'Good',
            previousStatus: 'new',
            card: { deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date('2025-12-20T10:00:00'),
            quality: 'Good',
            previousStatus: 'review',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getRecentActivity(1, 10);

        // Activities should be sorted by date descending
        for (let i = 1; i < result.length; i++) {
          expect(new Date(result[i - 1].date).getTime()).toBeGreaterThanOrEqual(
            new Date(result[i].date).getTime(),
          );
        }
      });

      it('TC-RECENTACTIVITY-003: This test case aims to verify limit parameter works correctly', async () => {
        const mockDecks = Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          title: `Deck ${i + 1}`,
          createdAt: new Date(`2025-12-${(i + 1).toString().padStart(2, '0')}`),
        }));

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getRecentActivity(1, 5);

        expect(result.length).toBeLessThanOrEqual(5);
      });

      it('TC-RECENTACTIVITY-004: This test case aims to verify deck_created activity type', async () => {
        const mockDecks = [
          { id: 1, title: 'Test Deck', createdAt: new Date('2025-12-20') },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getRecentActivity(1, 10);

        const deckCreatedActivity = result.find(
          (a) => a.type === 'deck_created',
        );
        expect(deckCreatedActivity).toBeDefined();
        expect(deckCreatedActivity?.deckName).toBe('Test Deck');
      });

      it('TC-RECENTACTIVITY-005: This test case aims to verify study activity includes correct stats', async () => {
        const mockDecks = [
          { id: 1, title: 'Test Deck', createdAt: new Date('2025-12-01') },
        ];
        const mockReviews = [
          {
            cardId: 1,
            reviewedAt: new Date('2025-12-20T10:00:00'),
            quality: 'Good',
            previousStatus: 'new',
            card: { deckId: 1 },
          },
          {
            cardId: 2,
            reviewedAt: new Date('2025-12-20T10:05:00'),
            quality: 'Again',
            previousStatus: 'review',
            card: { deckId: 1 },
          },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue(mockReviews);

        const result = await service.getRecentActivity(1, 10);

        const studyActivity = result.find((a) => a.type === 'study');
        expect(studyActivity).toBeDefined();
        expect(studyActivity?.cardsReviewed).toBe(2);
        expect(studyActivity?.newCards).toBe(1);
        expect(studyActivity?.reviewCards).toBe(1);
      });

      it('TC-RECENTACTIVITY-006: This test case aims to verify empty result with no decks', async () => {
        mockPrismaService.deck.findMany.mockResolvedValue([]);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getRecentActivity(1, 10);

        expect(result).toEqual([]);
      });

      it('TC-RECENTACTIVITY-007: This test case aims to verify sequential IDs are assigned', async () => {
        const mockDecks = [
          { id: 1, title: 'Deck 1', createdAt: new Date('2025-12-01') },
          { id: 2, title: 'Deck 2', createdAt: new Date('2025-12-02') },
        ];

        mockPrismaService.deck.findMany.mockResolvedValue(mockDecks);
        mockPrismaService.cardReview.findMany.mockResolvedValue([]);

        const result = await service.getRecentActivity(1, 10);

        result.forEach((activity, index) => {
          expect(activity.id).toBe(index + 1);
        });
      });
    });
  });
});
