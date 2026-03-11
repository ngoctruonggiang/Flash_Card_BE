import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { PrismaService } from '../prisma.service';
import { CardReview, ReviewQuality } from '@prisma/client';

describe('ReviewService - Preview Functionality', () => {
  let service: ReviewService;

  const mockPrismaService = {
    cardReview: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReviewPreview', () => {
    it('should return preview intervals for a new card (no previous review)', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      const result = await service.getReviewPreview(1);

      expect(result).toEqual({
        Again: '1 day',
        Hard: '1 day',
        Good: '3 days',
        Easy: '5 days',
      });

      expect(mockPrismaService.cardReview.findFirst).toHaveBeenCalledWith({
        where: { cardId: 1 },
        orderBy: { reviewedAt: 'desc' },
      });
    });

    it('should return preview intervals for a card with one previous review', async () => {
      const previousReview: CardReview = {
        id: 1,
        cardId: 1,
        quality: 'Good' as ReviewQuality,
        repetitions: 1,
        interval: 1,
        eFactor: 2.5,
        nextReviewDate: new Date('2025-01-02'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      expect(result).toEqual({
        Again: '1 day',
        Hard: '6 days',
        Good: '6 days',
        Easy: '6 days',
      });
    });

    it('should return preview intervals for a card with two previous reviews', async () => {
      const previousReview: CardReview = {
        id: 2,
        cardId: 1,
        quality: 'Good' as ReviewQuality,
        repetitions: 2,
        interval: 6,
        eFactor: 2.5,
        nextReviewDate: new Date('2025-01-08'),
        reviewedAt: new Date('2025-01-02'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      // repetitions = 3, so intervals are differentiated
      // Note: eFactor is updated AFTER interval calculation in SM-2
      expect(result.Again).toBe('1 day');
      // Hard: Fixed growth, round(6 * 1.2) = 7
      expect(result.Hard).toBe('7 days');
      // Good: Standard growth, round(6 * 2.5) = 15
      expect(result.Good).toBe('15 days');
      // Easy: Bonus growth, round(6 * 2.5 * 1.3) = 20
      expect(result.Easy).toBe('20 days');
    });

    it('should show "Again" always resets to 1 day regardless of previous progress', async () => {
      const previousReview: CardReview = {
        id: 5,
        cardId: 1,
        quality: 'Easy' as ReviewQuality,
        repetitions: 10,
        interval: 100,
        eFactor: 2.8,
        nextReviewDate: new Date('2025-04-11'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      expect(result.Again).toBe('1 day');
      // Other intervals should be differentiated
      // Hard: 100 * 1.2 = 120
      expect(parseInt(result.Hard)).toBe(120);
      // Good: 100 * 2.8 = 280
      expect(parseInt(result.Good)).toBe(280);
      // Easy: 100 * 2.8 * 1.3 = 364
      expect(parseInt(result.Easy)).toBe(364);
    });

    it('should show increasing intervals from Hard -> Good -> Easy', async () => {
      const previousReview: CardReview = {
        id: 3,
        cardId: 1,
        quality: 'Good' as ReviewQuality,
        repetitions: 3,
        interval: 15,
        eFactor: 2.5,
        nextReviewDate: new Date('2025-01-16'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      const againInterval = parseInt(result.Again);
      const hardInterval = parseInt(result.Hard);
      const goodInterval = parseInt(result.Good);
      const easyInterval = parseInt(result.Easy);

      // Again should be 1
      expect(againInterval).toBe(1);

      // For repetitions >= 3, intervals are now differentiated:
      // Hard: 15 * 1.2 = 18
      // Good: 15 * 2.5 = 38 (rounded)
      // Easy: 15 * 2.5 * 1.3 = 49 (rounded)
      expect(againInterval).toBe(1);
      expect(hardInterval).toBe(18);
      expect(goodInterval).toBe(38);
      expect(easyInterval).toBe(49);
      // Verify strict ordering: Again < Hard < Good < Easy
      expect(hardInterval).toBeLessThan(goodInterval);
      expect(goodInterval).toBeLessThan(easyInterval);
    });

    it('should format singular and plural days correctly for new cards', async () => {
      mockPrismaService.cardReview.findFirst.mockResolvedValue(null);

      const result = await service.getReviewPreview(1);

      // New cards now have differentiated intervals
      expect(result.Again).toBe('1 day'); // singular
      expect(result.Hard).toBe('1 day'); // singular
      expect(result.Good).toBe('3 days'); // plural
      expect(result.Easy).toBe('5 days'); // plural
    });

    it('should format plural days correctly', async () => {
      const previousReview: CardReview = {
        id: 1,
        cardId: 1,
        quality: 'Good' as ReviewQuality,
        repetitions: 1,
        interval: 1,
        eFactor: 2.5,
        nextReviewDate: new Date('2025-01-02'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      // Second review should have 6 days (plural)
      expect(result.Hard).toBe('6 days');
      expect(result.Good).toBe('6 days');
      expect(result.Easy).toBe('6 days');
    });

    it('should handle card with decreased eFactor from multiple "Hard" reviews', async () => {
      const previousReview: CardReview = {
        id: 4,
        cardId: 1,
        quality: 'Hard' as ReviewQuality,
        repetitions: 5,
        interval: 30,
        eFactor: 1.5, // Lower than default
        nextReviewDate: new Date('2025-01-31'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      expect(result.Again).toBe('1 day');

      // With lower eFactor, intervals grow slower
      const hardInterval = parseInt(result.Hard);
      const goodInterval = parseInt(result.Good);
      const easyInterval = parseInt(result.Easy);

      // Still should be in ascending order but closer together (may be equal due to rounding)
      expect(hardInterval).toBeLessThanOrEqual(goodInterval);
      expect(goodInterval).toBeLessThanOrEqual(easyInterval);
    });

    it('should handle card at minimum eFactor (1.3)', async () => {
      const previousReview: CardReview = {
        id: 4,
        cardId: 1,
        quality: 'Hard' as ReviewQuality,
        repetitions: 10,
        interval: 20,
        eFactor: 1.3, // Minimum allowed
        nextReviewDate: new Date('2025-01-21'),
        reviewedAt: new Date('2025-01-01'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      const result = await service.getReviewPreview(1);

      expect(result.Again).toBe('1 day');

      // Even at minimum eFactor, should still calculate valid intervals
      const hardInterval = parseInt(result.Hard);
      const goodInterval = parseInt(result.Good);
      const easyInterval = parseInt(result.Easy);

      expect(hardInterval).toBeGreaterThan(0);
      expect(goodInterval).toBeGreaterThan(0);
      expect(easyInterval).toBeGreaterThan(0);
    });

    it('should not mutate the database when generating previews', async () => {
      const previousReview: CardReview = {
        id: 1,
        cardId: 1,
        quality: 'Good' as ReviewQuality,
        repetitions: 2,
        interval: 6,
        eFactor: 2.5,
        nextReviewDate: new Date('2025-01-08'),
        reviewedAt: new Date('2025-01-02'),
      };

      mockPrismaService.cardReview.findFirst.mockResolvedValue(previousReview);

      await service.getReviewPreview(1);

      // Should only call findFirst, not create/update/delete
      expect(mockPrismaService.cardReview.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.cardReview.create).not.toHaveBeenCalled();
      expect(mockPrismaService.cardReview.update).not.toHaveBeenCalled();
      expect(mockPrismaService.cardReview.deleteMany).not.toHaveBeenCalled();
    });
  });
});
