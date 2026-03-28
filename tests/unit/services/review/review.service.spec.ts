/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaService } from 'src/services/prisma.service';
import { AnkiScheduler } from 'src/services/scheduler';
import { NotFoundException } from '@nestjs/common';

// Mock AnkiScheduler
jest.mock('src/services/scheduler');

describe('ReviewService', () => {
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
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup AnkiScheduler mock instance
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateReview', () => {
    it('should update a review', async () => {
      const mockReview: any = { id: 1, quality: 'Good' };
      mockPrismaService.cardReview.update.mockResolvedValue(mockReview);

      const result = await service.updateReview(mockReview);

      expect(result).toEqual(mockReview);
      expect(prismaService.cardReview.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: mockReview,
      });
    });
  });

  describe('removeByCardId', () => {
    it('should remove reviews by card id', async () => {
      mockPrismaService.cardReview.deleteMany.mockResolvedValue({ count: 5 });

      const result = await service.removeByCardId(1);

      expect(result).toEqual({ count: 5 });
      expect(prismaService.cardReview.deleteMany).toHaveBeenCalledWith({
        where: { cardId: 1 },
      });
    });
  });

  describe('addReview', () => {
    it('should create a review', async () => {
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
  });

  describe('getLastestReviewByCardId', () => {
    it('should return the latest review', async () => {
      const mockReview = { id: 1, reviewedAt: new Date() };
      mockPrismaService.cardReview.findFirst.mockResolvedValue(mockReview);

      const result = await service.getLastestReviewByCardId(1);

      expect(result).toEqual(mockReview);
      expect(prismaService.cardReview.findFirst).toHaveBeenCalledWith({
        where: { cardId: 1 },
        orderBy: { reviewedAt: 'desc' },
      });
    });
  });

  describe('submitReviews', () => {
    it('should process reviews and update cards', async () => {
      const submitDto: any = {
        CardReviews: [
          { cardId: 1, quality: 'Good' },
          { cardId: 2, quality: 'Again' },
        ],
      };

      const mockCard1 = {
        id: 1,
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };
      const mockCard2 = {
        id: 2,
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 1,
      };

      mockPrismaService.card.findUnique
        .mockResolvedValueOnce(mockCard1)
        .mockResolvedValueOnce(mockCard2);

      const nextState1 = {
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReviewDate: new Date(),
      };
      const nextState2 = {
        status: 'relearning',
        stepIndex: 0,
        easeFactor: 2.3,
        interval: 0,
        nextReviewDate: new Date(),
      };

      mockAnkiScheduler.calculateNext
        .mockReturnValueOnce(nextState1)
        .mockReturnValueOnce(nextState2);

      mockPrismaService.card.update.mockResolvedValue({});
      mockPrismaService.cardReview.create.mockResolvedValue({});

      const result = await service.submitReviews(submitDto);

      expect(result).toHaveLength(2);
      expect(prismaService.card.findUnique).toHaveBeenCalledTimes(2);
      expect(mockAnkiScheduler.calculateNext).toHaveBeenCalledTimes(2);
      expect(prismaService.$transaction).toHaveBeenCalledTimes(2); // Called once per card loop
    });

    it('should skip if card not found', async () => {
      const submitDto: any = {
        CardReviews: [{ cardId: 999, quality: 'Good' }],
      };

      mockPrismaService.card.findUnique.mockResolvedValue(null);

      const result = await service.submitReviews(submitDto);

      expect(result).toHaveLength(0);
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getDueReviews', () => {
    it('should return due cards', async () => {
      const mockCards = [{ id: 1 }, { id: 2 }];
      mockPrismaService.card.findMany.mockResolvedValue(mockCards);

      const result = await service.getDueReviews(1, 10);

      expect(result).toEqual(mockCards);
      expect(prismaService.card.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deckId: 1,
            OR: expect.any(Array),
          }),
          take: 10,
          orderBy: { nextReviewDate: 'asc' },
        }),
      );
    });
  });

  describe('getReviewPreview', () => {
    it('should return preview for all ratings', async () => {
      const mockCard = {
        id: 1,
        status: 'learning',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 0,
      };
      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);

      mockAnkiScheduler.calculateNext.mockReturnValue({
        status: 'review',
        interval: 1,
      });

      const result = await service.getReviewPreview(1);

      expect(result).toHaveProperty('Again');
      expect(result).toHaveProperty('Hard');
      expect(result).toHaveProperty('Good');
      expect(result).toHaveProperty('Easy');
      expect(mockAnkiScheduler.calculateNext).toHaveBeenCalledTimes(4);
    });

    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.card.findUnique.mockResolvedValue(null);

      await expect(service.getReviewPreview(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getConsecutiveStudyDays', () => {
    it('should return 0 if no cards', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result).toEqual({
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      });
    });

    it('should return 0 if no reviews', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaService.cardReview.findMany.mockResolvedValue([]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result).toEqual({
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      });
    });

    it('should calculate consecutive days correctly', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
        { reviewedAt: yesterday },
        { reviewedAt: twoDaysAgo },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(3);
      expect(result.lastStudyDate).toBeDefined();
    });

    it('should break streak if gap > 1 day', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);

      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: today },
        { reviewedAt: threeDaysAgo },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(1);
    });

    it('should return 0 if last study was long ago', async () => {
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 1 }]);

      const longAgo = new Date();
      longAgo.setDate(longAgo.getDate() - 10);

      mockPrismaService.cardReview.findMany.mockResolvedValue([
        { reviewedAt: longAgo },
      ]);

      const result = await service.getConsecutiveStudyDays(1);

      expect(result.consecutiveDays).toBe(0);
    });
  });
});
