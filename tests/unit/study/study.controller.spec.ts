/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { StudyController } from 'src/controllers/study/study.controller';
import { ReviewService } from 'src/services/review/review.service';
import { StudyService } from 'src/services/study/study.service';
import { NotFoundException } from '@nestjs/common';

describe('StudyController  Tests', () => {
  let controller: StudyController;
  let reviewService: ReviewService;
  let studyService: StudyService;

  const mockReviewService = {
    getDueReviews: jest.fn(),
    getReviewPreview: jest.fn(),
    submitReviews: jest.fn(),
    getConsecutiveStudyDays: jest.fn(),
    submitCramReviews: jest.fn(),
  };

  const mockStudyService = {
    getCramCards: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyController],
      providers: [
        { provide: ReviewService, useValue: mockReviewService },
        { provide: StudyService, useValue: mockStudyService },
      ],
    }).compile();

    controller = module.get<StudyController>(StudyController);
    reviewService = module.get<ReviewService>(ReviewService);
    studyService = module.get<StudyService>(StudyService);
  });

  describe('UC-20: Start Study Session', () => {
    it('should return due reviews for a deck', async () => {
      const dueCards = [
        { id: 1, front: 'Card 1', status: 'review' },
        { id: 2, front: 'Card 2', status: 'learning' },
      ];
      mockReviewService.getDueReviews.mockResolvedValue(dueCards);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual(dueCards);
      expect(reviewService.getDueReviews).toHaveBeenCalledWith(1);
    });

    it('should return empty array when no cards due', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual([]);
    });

    it('should propagate NotFoundException', async () => {
      mockReviewService.getDueReviews.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getDueReviews({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle different deck ids', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      await controller.getDueReviews({ id: 42 });

      expect(reviewService.getDueReviews).toHaveBeenCalledWith(42);
    });

    it('should return cards with all statuses', async () => {
      const dueCards = [
        { id: 1, status: 'new' },
        { id: 2, status: 'learning' },
        { id: 3, status: 'review' },
        { id: 4, status: 'relearning' },
      ];
      mockReviewService.getDueReviews.mockResolvedValue(dueCards);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toHaveLength(4);
    });
  });

  describe('getReviewPreview', () => {
    it('should return preview for all quality options', async () => {
      const preview = {
        Again: '1 min',
        Hard: '1 min',
        Good: '10 min',
        Easy: '4 days',
      };
      mockReviewService.getReviewPreview.mockResolvedValue(preview);

      const result = await controller.getReviewPreview({ id: 1 });

      expect(result).toEqual(preview);
      expect(reviewService.getReviewPreview).toHaveBeenCalledWith(1);
    });

    it('should propagate NotFoundException for non-existent card', async () => {
      mockReviewService.getReviewPreview.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.getReviewPreview({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle string id conversion', async () => {
      const preview = {
        Again: '1 min',
        Hard: '1 min',
        Good: '10 min',
        Easy: '4 days',
      };
      mockReviewService.getReviewPreview.mockResolvedValue(preview);

      await controller.getReviewPreview({ id: '42' as any });

      expect(reviewService.getReviewPreview).toHaveBeenCalledWith(42);
    });

    it('should return day intervals for review cards', async () => {
      const preview = {
        Again: '10 min',
        Hard: '12 days',
        Good: '25 days',
        Easy: '32 days',
      };
      mockReviewService.getReviewPreview.mockResolvedValue(preview);

      const result = await controller.getReviewPreview({ id: 1 });

      expect(result.Good).toContain('days');
    });

    it('should return minute intervals for learning cards', async () => {
      const preview = {
        Again: '1 min',
        Hard: '1 min',
        Good: '10 min',
        Easy: '4 days',
      };
      mockReviewService.getReviewPreview.mockResolvedValue(preview);

      const result = await controller.getReviewPreview({ id: 1 });

      expect(result.Again).toContain('min');
    });
  });

  describe('UC-21: Record Review Outcome', () => {
    it('should submit single review', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
      };
      const reviewResult = [
        {
          cardId: 1,
          quality: 'Good',
          previousStatus: 'learning',
          newStatus: 'review',
        },
      ];
      mockReviewService.submitReviews.mockResolvedValue(reviewResult);

      const result = await controller.submitReview(submitDto as any);

      expect(result).toEqual(reviewResult);
      expect(reviewService.submitReviews).toHaveBeenCalledWith(submitDto);
    });

    it('should submit multiple reviews', async () => {
      const submitDto = {
        CardReviews: [
          { cardId: 1, quality: 'Good' },
          { cardId: 2, quality: 'Again' },
          { cardId: 3, quality: 'Easy' },
        ],
      };
      const reviewResults = [
        { cardId: 1, quality: 'Good' },
        { cardId: 2, quality: 'Again' },
        { cardId: 3, quality: 'Easy' },
      ];
      mockReviewService.submitReviews.mockResolvedValue(reviewResults);

      const result = await controller.submitReview(submitDto as any);

      expect(result).toHaveLength(3);
    });

    it('should handle all quality types', async () => {
      const qualities = ['Again', 'Hard', 'Good', 'Easy'];

      for (const quality of qualities) {
        const submitDto = {
          CardReviews: [{ cardId: 1, quality }],
        };
        mockReviewService.submitReviews.mockResolvedValue([{ quality }]);

        const result = await controller.submitReview(submitDto as any);

        expect(result[0].quality).toBe(quality);
      }
    });

    it('should handle empty CardReviews array', async () => {
      const submitDto = { CardReviews: [] };
      mockReviewService.submitReviews.mockResolvedValue([]);

      const result = await controller.submitReview(submitDto as any);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 999, quality: 'Good' }],
      };
      mockReviewService.submitReviews.mockRejectedValue(
        new Error('Card not found'),
      );

      await expect(controller.submitReview(submitDto as any)).rejects.toThrow(
        'Card not found',
      );
    });
  });

  describe('UC-23: View Study Session Statistics', () => {
    it('should return consecutive study days', async () => {
      const consecutiveData = {
        consecutiveDays: 7,
        streakStartDate: new Date('2025-01-08'),
        lastStudyDate: new Date('2025-01-15'),
      };
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue(
        consecutiveData,
      );

      const result = await controller.getConsecutiveDays({ id: 1 });

      expect(result).toEqual(consecutiveData);
      expect(reviewService.getConsecutiveStudyDays).toHaveBeenCalledWith(1);
    });

    it('should return 0 days when never studied', async () => {
      const consecutiveData = {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      };
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue(
        consecutiveData,
      );

      const result = await controller.getConsecutiveDays({ id: 1 });

      expect(result.consecutiveDays).toBe(0);
    });

    it('should return 0 days when streak broken', async () => {
      const consecutiveData = {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: new Date('2025-01-10'),
      };
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue(
        consecutiveData,
      );

      const result = await controller.getConsecutiveDays({ id: 1 });

      expect(result.consecutiveDays).toBe(0);
    });

    it('should handle string id conversion', async () => {
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue({
        consecutiveDays: 1,
        streakStartDate: new Date(),
        lastStudyDate: new Date(),
      });

      await controller.getConsecutiveDays({ id: '42' as any });

      expect(reviewService.getConsecutiveStudyDays).toHaveBeenCalledWith(42);
    });

    it('should propagate NotFoundException', async () => {
      mockReviewService.getConsecutiveStudyDays.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getConsecutiveDays({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startCramSession', () => {
    it('should start cram session with default limit', async () => {
      const cards = [
        { id: 1, front: 'Card 1' },
        { id: 2, front: 'Card 2' },
      ];
      mockStudyService.getCramCards.mockResolvedValue(cards);

      const result = await controller.startCramSession(mockUser as any, 1);

      expect(result).toEqual({
        message: 'Cram session started',
        data: cards,
        total: 2,
      });
      expect(studyService.getCramCards).toHaveBeenCalledWith(
        mockUser.id,
        1,
        50,
      );
    });

    it('should start cram session with custom limit', async () => {
      const cards = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      mockStudyService.getCramCards.mockResolvedValue(cards);

      const result = await controller.startCramSession(mockUser as any, 1, 10);

      expect(result.total).toBe(10);
      expect(studyService.getCramCards).toHaveBeenCalledWith(
        mockUser.id,
        1,
        10,
      );
    });

    it('should return empty array when no cards', async () => {
      mockStudyService.getCramCards.mockResolvedValue([]);

      const result = await controller.startCramSession(mockUser as any, 1);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should propagate NotFoundException for wrong deck', async () => {
      mockStudyService.getCramCards.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.startCramSession(mockUser as any, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('should convert string limit to number', async () => {
      mockStudyService.getCramCards.mockResolvedValue([]);

      await controller.startCramSession(mockUser as any, 1, '25' as any);

      expect(studyService.getCramCards).toHaveBeenCalledWith(
        mockUser.id,
        1,
        25,
      );
    });

    it('should use correct user id', async () => {
      const user = { ...mockUser, id: 99 };
      mockStudyService.getCramCards.mockResolvedValue([]);

      await controller.startCramSession(user as any, 1);

      expect(studyService.getCramCards).toHaveBeenCalledWith(99, 1, 50);
    });

    it('should handle undefined limit', async () => {
      mockStudyService.getCramCards.mockResolvedValue([]);

      await controller.startCramSession(mockUser as any, 1, undefined);

      expect(studyService.getCramCards).toHaveBeenCalledWith(
        mockUser.id,
        1,
        50,
      );
    });
  });

  describe('submitCramReview', () => {
    it('should submit cram review', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
      };
      const reviewResult = [
        {
          cardId: 1,
          quality: 'Good',
          previousStatus: 'review',
          newStatus: 'review', // Status unchanged in cram mode
        },
      ];
      mockReviewService.submitCramReviews.mockResolvedValue(reviewResult);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result).toEqual(reviewResult);
      expect(reviewService.submitCramReviews).toHaveBeenCalledWith(submitDto);
    });

    it('should submit multiple cram reviews', async () => {
      const submitDto = {
        CardReviews: [
          { cardId: 1, quality: 'Good' },
          { cardId: 2, quality: 'Again' },
        ],
      };
      mockReviewService.submitCramReviews.mockResolvedValue([
        { cardId: 1 },
        { cardId: 2 },
      ]);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result).toHaveLength(2);
    });

    it('should not affect card scheduling', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 1, quality: 'Easy' }],
      };
      const reviewResult = [
        {
          cardId: 1,
          previousStatus: 'review',
          newStatus: 'review', // Same status
        },
      ];
      mockReviewService.submitCramReviews.mockResolvedValue(reviewResult);

      const result = await controller.submitCramReview(submitDto as any);

      // In cram mode, status should remain the same
      expect(result[0].previousStatus).toBe(result[0].newStatus);
    });

    it('should handle empty CardReviews', async () => {
      const submitDto = { CardReviews: [] };
      mockReviewService.submitCramReviews.mockResolvedValue([]);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result).toEqual([]);
    });

    it('should propagate service errors', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 999, quality: 'Good' }],
      };
      mockReviewService.submitCramReviews.mockRejectedValue(
        new Error('Card not found'),
      );

      await expect(
        controller.submitCramReview(submitDto as any),
      ).rejects.toThrow('Card not found');
    });
  });

  describe('Controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have reviewService injected', () => {
      expect(reviewService).toBeDefined();
    });

    it('should have studyService injected', () => {
      expect(studyService).toBeDefined();
    });
  });
});
