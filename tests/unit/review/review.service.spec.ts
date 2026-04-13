/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaService } from 'src/services/prisma.service';
import { AnkiScheduler } from 'src/services/scheduler';
import { NotFoundException } from '@nestjs/common';
import { ReviewQuality, CardStatus } from '@prisma/client';

// Mock AnkiScheduler
jest.mock('src/services/scheduler');

describe('ReviewService  Tests', () => {
  let service: ReviewService;
  let prismaService: PrismaService;
  let mockAnkiScheduler: any;

  const mockPrismaService = {
    cardReview: {
      update: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    deck: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAnkiScheduler = {
      calculateNext: jest.fn(),
    };
    (AnkiScheduler as jest.Mock).mockImplementation(() => mockAnkiScheduler);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const mockReview: any = {
        id: 1,
        quality: 'Good',
        interval: 10,
        eFactor: 2.5,
      };
      mockPrismaService.cardReview.update.mockResolvedValue(mockReview);

      const result = await service.updateReview(mockReview);

      expect(result).toEqual(mockReview);
      expect(prismaService.cardReview.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: mockReview,
      });
    });

    it('should handle review with all fields', async () => {
      const mockReview: any = {
        id: 1,
        cardId: 1,
        quality: 'Easy',
        repetitions: 5,
        interval: 30,
        eFactor: 2.8,
        nextReviewDate: new Date(),
        reviewedAt: new Date(),
        previousStatus: 'review',
        newStatus: 'review',
      };
      mockPrismaService.cardReview.update.mockResolvedValue(mockReview);

      const result = await service.updateReview(mockReview);

      expect(result).toEqual(mockReview);
    });

    it('should throw error for non-existent review', async () => {
      mockPrismaService.cardReview.update.mockRejectedValue(
        new Error('Record not found'),
      );

      await expect(service.updateReview({ id: 999 } as any)).rejects.toThrow(
        'Record not found',
      );
    });
  });

  describe('removeByCardId', () => {
    it('should remove all reviews for a card', async () => {
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.removeByCardId(1);

      expect(result).toEqual({ count: 5 });
      expect(prismaService.cardReview.deleteMany).toHaveBeenCalledWith({
        where: { cardId: 1 },
      });
    });

    it('should return count 0 when no reviews exist', async () => {
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.removeByCardId(999);

      expect(result).toEqual({ count: 0 });
    });

    it('should handle cardId = 0', async () => {
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 0 });

      await service.removeByCardId(0);

      expect(prismaService.cardReview.deleteMany).toHaveBeenCalledWith({
        where: { cardId: 0 },
      });
    });

    it('should handle negative cardId', async () => {
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 0 });

      await service.removeByCardId(-1);

      expect(prismaService.cardReview.deleteMany).toHaveBeenCalledWith({
        where: { cardId: -1 },
      });
    });
  });

  describe('addReview', () => {
    it('should create a new review', async () => {
      const mockReview: any = {
        cardId: 1,
        quality: 'Good',
        repetitions: 0,
        interval: 1,
        eFactor: 2.5,
        nextReviewDate: new Date(),
        reviewedAt: new Date(),
        previousStatus: 'learning',
        newStatus: 'review',
      };
      mockPrismaService.cardReview.create.mockResolvedValue({
        id: 1,
        ...mockReview,
      });

      const result = await service.addReview(mockReview);

      expect(result).toEqual({ id: 1, ...mockReview });
      expect(prismaService.cardReview.create).toHaveBeenCalledWith({
        data: mockReview,
      });
    });

    it('should handle all quality types', async () => {
      const qualities = ['Again', 'Hard', 'Good', 'Easy'];

      for (const quality of qualities) {
        const mockReview: any = {
          cardId: 1,
          quality,
          repetitions: 0,
          interval: 1,
          eFactor: 2.5,
          nextReviewDate: new Date(),
          reviewedAt: new Date(),
          previousStatus: 'new',
          newStatus: 'learning',
        };
        mockPrismaService.cardReview.create.mockResolvedValue({
          id: 1,
          ...mockReview,
        });

        const result = await service.addReview(mockReview);

        expect(result.quality).toBe(quality);
      }
    });

    it('should handle all status transitions', async () => {
      const statuses = ['new', 'learning', 'review', 'relearning'];

      for (const status of statuses) {
        const mockReview: any = {
          cardId: 1,
          quality: 'Good',
          repetitions: 0,
          interval: 1,
          eFactor: 2.5,
          nextReviewDate: new Date(),
          reviewedAt: new Date(),
          previousStatus: status,
          newStatus: 'review',
        };
        mockPrismaService.cardReview.create.mockResolvedValue({
          id: 1,
          ...mockReview,
        });

        const result = await service.addReview(mockReview);

        expect(result.previousStatus).toBe(status);
      }
    });
  });

  describe('getLastestReviewByCardId', () => {
    it('should return the latest review', async () => {
      const mockReview = {
        id: 1,
        cardId: 1,
        reviewedAt: new Date('2025-12-01'),
      };
      mockPrismaService.cardReview.findFirst.mockResolvedValue(mockReview);

      const result = await service.getLastestReviewByCardId(1);

      expect(result).toEqual(mockReview);
      expect(prismaService.cardReview.findFirst).toHaveBeenCalledWith({
        where: { cardId: 1 },
        orderBy: { reviewedAt: 'desc' },
      });
    });

    it('should return null when no reviews exist', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      const result = await service.getLastestReviewByCardId(999);

      expect(result).toBeNull();
    });

    it('should order by reviewedAt desc', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      await service.getLastestReviewByCardId(1);

      expect(prismaService.cardReview.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { reviewedAt: 'desc' },
        }),
      );
    });
  });

  describe('UC-21: Record Review Outcome', () => {
    describe('Single review submission', () => {
      it('should process single review successfully', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Good' }],
        };
        const mockCard = {
          id: 1,
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 0,
        };
        const nextState = {
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        };

        mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
        mockAnkiScheduler.calculateNext.mockReturnValue(nextState);
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result).toHaveLength(1);
        expect(prismaService.$transaction).toHaveBeenCalled();
      });

      it('should throw NotFoundException for non-existent cards', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 999, quality: 'Good' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue(null);

        await expect(service.submitReviews(submitDto)).rejects.toThrow(
          'Card with id 999 not found',
        );
      });
    });

    describe('Multiple review submission', () => {
      it('should process multiple reviews', async () => {
        const submitDto: any = {
          CardReviews: [
            { cardId: 1, quality: 'Good' },
            { cardId: 2, quality: 'Again' },
            { cardId: 3, quality: 'Easy' },
          ],
        };

        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'learning',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 0,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result).toHaveLength(3);
      });

      it('should throw NotFoundException when processing card that does not exist', async () => {
        const submitDto: any = {
          CardReviews: [
            { cardId: 1, quality: 'Good' },
            { cardId: 999, quality: 'Good' }, // Non-existent
            { cardId: 2, quality: 'Easy' },
          ],
        };

        mockPrismaService.card.findUnique
          .mockResolvedValueOnce({
            id: 1,
            status: 'learning',
            stepIndex: 0,
            easeFactor: 2.5,
            interval: 0,
          })
          .mockResolvedValueOnce(null); // Card 999 doesn't exist - will throw

        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        await expect(service.submitReviews(submitDto)).rejects.toThrow(
          'Card with id 999 not found',
        );
      });
    });

    describe('Quality handling', () => {
      it('should handle Again quality', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Again' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'relearning',
          stepIndex: 0,
          easeFactor: 2.3,
          interval: 10,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result[0].quality).toBe('Again');
      });

      it('should handle Hard quality', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Hard' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.35,
          interval: 12,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result[0].quality).toBe('Hard');
      });

      it('should handle Good quality', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Good' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 25,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result[0].quality).toBe('Good');
      });

      it('should handle Easy quality', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Easy' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 10,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.65,
          interval: 32,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result[0].quality).toBe('Easy');
      });
    });

    describe('Status transitions', () => {
      it('should track previousStatus and newStatus', async () => {
        const submitDto: any = {
          CardReviews: [{ cardId: 1, quality: 'Good' }],
        };
        mockPrismaService.card.findUnique.mockResolvedValue({
          id: 1,
          status: 'learning',
          stepIndex: 1,
          easeFactor: 2.5,
          interval: 10,
        });
        mockAnkiScheduler.calculateNext.mockReturnValue({
          status: 'review',
          stepIndex: 0,
          easeFactor: 2.5,
          interval: 1,
          nextReviewDate: new Date(),
        });
        mockPrismaService.card.update.mockResolvedValue({});
        mockPrismaService.cardReview.create.mockResolvedValue({});

        const result = await service.submitReviews(submitDto);

        expect(result[0].previousStatus).toBe('learning');
        expect(result[0].newStatus).toBe('review');
      });
    });

    describe('Empty submission', () => {
      it('should handle empty CardReviews array', async () => {
        const submitDto: any = { CardReviews: [] };

        const result = await service.submitReviews(submitDto);

        expect(result).toEqual([]);
      });
    });
  });

  describe('submitCramReviews', () => {
    it('should create review without updating card schedule', async () => {
      const submitDto: any = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
      };
      const mockCard = {
        id: 1,
        status: 'review',
        interval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardReview.create.mockResolvedValue({
        id: 1,
        cardId: 1,
        quality: 'Good',
      });

      const result = await service.submitCramReviews(submitDto);

      expect(result).toHaveLength(1);
      expect(prismaService.card.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent cards', async () => {
      const submitDto: any = {
        CardReviews: [{ cardId: 999, quality: 'Good' }],
      };
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.submitCramReviews(submitDto)).rejects.toThrow(
        'Card with id 999 not found',
      );
    });

    it('should preserve card status in review', async () => {
      const submitDto: any = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
      };
      const mockCard = {
        id: 1,
        status: 'review',
        interval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardReview.create.mockImplementation((args) =>
        Promise.resolve({ id: 1, ...args.data }),
      );

      await service.submitCramReviews(submitDto);

      expect(prismaService.cardReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousStatus: 'review',
          newStatus: 'review', // Status unchanged
        }),
      });
    });

    it('should use custom reviewedAt if provided', async () => {
      const reviewedAt = new Date('2025-12-01T10:00:00.000Z');
      const submitDto: any = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
        reviewedAt,
      };
      const mockCard = {
        id: 1,
        status: 'review',
        interval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardReview.create.mockImplementation((args) =>
        Promise.resolve({ id: 1, ...args.data }),
      );

      await service.submitCramReviews(submitDto);

      expect(prismaService.cardReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reviewedAt,
        }),
      });
    });

    it('should handle multiple cram reviews', async () => {
      const submitDto: any = {
        CardReviews: [
          { cardId: 1, quality: 'Good' },
          { cardId: 2, quality: 'Easy' },
          { cardId: 3, quality: 'Again' },
        ],
      };
      mockPrismaService.card.findUnique.mockResolvedValue({
        id: 1,
        status: 'review',
        interval: 10,
        easeFactor: 2.5,
        nextReviewDate: new Date(),
      });
      mockPrismaService.cardReview.create.mockResolvedValue({ id: 1 });

      const result = await service.submitCramReviews(submitDto);

      expect(result).toHaveLength(3);
    });
  });

  describe('getDueReviews', () => {
    beforeEach(() => {
      // Mock deck existence check
      mockPrismaService.deck.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Deck',
      });
    });

    it('should return due cards', async () => {
      const mockCards = [
        { id: 1, status: 'new', nextReviewDate: null },
        { id: 2, status: 'review', nextReviewDate: new Date('2025-01-01') },
      ];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await service.getDueReviews(1);

      expect(result).toHaveLength(2);
    });

    it('should return empty array when no cards due', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await service.getDueReviews(1);

      expect(result).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.getDueReviews(1, 10);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it('should order by nextReviewDate asc', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.getDueReviews(1);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nextReviewDate: 'asc' },
        }),
      );
    });

    it('should include new cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.getDueReviews(1);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ status: 'new' }]),
          }),
        }),
      );
    });

    it('should include learning cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.getDueReviews(1);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ status: 'learning' }),
            ]),
          }),
        }),
      );
    });

    it('should include relearning cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      await service.getDueReviews(1);

      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ status: 'relearning' }),
            ]),
          }),
        }),
      );
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(service.getDueReviews(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getReviewPreview', () => {
    it('should return preview for all quality options', async () => {
      const mockCard = {
        id: 1,
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockAnkiScheduler.calculateNext
        .mockReturnValueOnce({
          status: 'learning',
          interval: 1,
        })
        .mockReturnValueOnce({
          status: 'learning',
          interval: 1,
        })
        .mockReturnValueOnce({
          status: 'learning',
          interval: 10,
        })
        .mockReturnValueOnce({
          status: 'review',
          interval: 4,
        });

      const result = await service.getReviewPreview(1);

      expect(result).toHaveProperty('Again');
      expect(result).toHaveProperty('Hard');
      expect(result).toHaveProperty('Good');
      expect(result).toHaveProperty('Easy');
    });

    it('should throw NotFoundException for non-existent card', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.getReviewPreview(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should format intervals in minutes for learning cards', async () => {
      const mockCard = {
        id: 1,
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockAnkiScheduler.calculateNext.mockReturnValue({
        status: 'learning',
        interval: 10,
      });

      const result = await service.getReviewPreview(1);

      expect(result.Again).toContain('min');
    });

    it('should format intervals in days for review cards', async () => {
      const mockCard = {
        id: 1,
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockAnkiScheduler.calculateNext.mockReturnValue({
        status: 'review',
        interval: 25,
      });

      const result = await service.getReviewPreview(1);

      expect(result.Good).toContain('day');
    });

    it('should handle singular day', async () => {
      const mockCard = {
        id: 1,
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 1,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockAnkiScheduler.calculateNext.mockReturnValue({
        status: 'review',
        interval: 1,
      });

      const result = await service.getReviewPreview(1);

      expect(result.Good).toBe('1 day');
    });

    it('should handle plural days', async () => {
      const mockCard = {
        id: 1,
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockAnkiScheduler.calculateNext.mockReturnValue({
        status: 'review',
        interval: 25,
      });

      const result = await service.getReviewPreview(1);

      expect(result.Good).toBe('25 days');
    });
  });

  describe('getConsecutiveStudyDays', () => {
    beforeEach(() => {
      // Mock deck existence check
      mockPrismaService.deck.findUnique.mockResolvedValue({
        id: 1,
        name: 'Test Deck',
      });
    });

    it('should return 0 when deck has no cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result).toEqual({
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      });
    });

    it('should return 0 when no reviews exist', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result).toEqual({
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      });
    });

    it('should return streak of 1 for study today only', async () => {
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(1);
    });

    it('should return 0 when streak is broken', async () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: twoDaysAgo },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(0);
    });

    it('should count consecutive days correctly', async () => {
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
        { reviewedAt: yesterday },
        { reviewedAt: twoDaysAgo },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(3);
    });

    it('should not count duplicate days multiple times', async () => {
      const today = new Date();
      today.setHours(10, 0, 0, 0);
      const todayMorning = new Date(today);
      todayMorning.setHours(8, 0, 0, 0);
      const todayEvening = new Date(today);
      todayEvening.setHours(20, 0, 0, 0);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: todayMorning },
        { reviewedAt: todayEvening },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      // Multiple reviews on same day should still count as 1 day
      expect(result.consecutiveDays).toBeGreaterThanOrEqual(1);
    });

    it('should include lastStudyDate in result', async () => {
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.lastStudyDate).toBeDefined();
    });

    it('should include streakStartDate in result', async () => {
      const today = new Date();
      today.setUTCHours(10, 0, 0, 0);

      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.streakStartDate).toBeDefined();
    });

    it('should throw NotFoundException when deck does not exist', async () => {
      mockPrismaService.deck.findUnique.mockResolvedValue(null);

      await expect(service.getConsecutiveStudyDays(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
