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
    it('TC-103: should return due cards when deck has cards due, returns array of due cards', async () => {
      const dueCards = [
        { id: 1, front: 'Card 1', status: 'review' },
        { id: 2, front: 'Card 2', status: 'learning' },
      ];
      mockReviewService.getDueReviews.mockResolvedValue(dueCards);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual(dueCards);
      expect(reviewService.getDueReviews).toHaveBeenCalledWith(1);
    });

    it('TC-104: should return empty array when no cards are due, returns empty array', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual([]);
    });

    it('TC-105: should throw NotFoundException when deck does not exist, returns 404 error', async () => {
      mockReviewService.getDueReviews.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getDueReviews({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-106: should return due cards when deck id is 42, returns cards for deck 42', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      await controller.getDueReviews({ id: 42 });

      expect(reviewService.getDueReviews).toHaveBeenCalledWith(42);
    });

    it('TC-107: should return cards with all statuses when mixed cards due, returns all status types', async () => {
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
    it('TC-108: should return preview when card exists, returns all quality options', async () => {
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

    it('TC-109: should throw NotFoundException when card does not exist, returns 404 error', async () => {
      mockReviewService.getReviewPreview.mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      await expect(controller.getReviewPreview({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-110: should convert string id to number when string provided, returns preview', async () => {
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

    it('TC-111: should return day intervals when card is in review status, returns days format', async () => {
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

    it('TC-112: should return minute intervals when card is learning, returns minutes format', async () => {
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
    it('TC-113: should submit review when single card reviewed, returns review result', async () => {
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

    it('TC-114: should submit reviews when multiple cards reviewed, returns all review results', async () => {
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

    it('TC-115: should submit review when any quality type provided, returns result with quality', async () => {
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

    it('TC-116: should return empty array when CardReviews is empty, returns empty array', async () => {
      const submitDto = { CardReviews: [] };
      mockReviewService.submitReviews.mockResolvedValue([]);

      const result = await controller.submitReview(submitDto as any);

      expect(result).toEqual([]);
    });

    it('TC-117: should throw error when card does not exist, returns error message', async () => {
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
    it('TC-118: should return consecutive days when streak exists, returns streak data', async () => {
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

    it('TC-119: should return 0 days when deck never studied, returns zero streak', async () => {
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

    it('TC-120: should return 0 days when streak is broken, returns broken streak', async () => {
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

    it('TC-121: should convert string id to number when string provided, returns streak data', async () => {
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue({
        consecutiveDays: 1,
        streakStartDate: new Date(),
        lastStudyDate: new Date(),
      });

      await controller.getConsecutiveDays({ id: '42' as any });

      expect(reviewService.getConsecutiveStudyDays).toHaveBeenCalledWith(42);
    });

    it('TC-122: should throw NotFoundException when deck does not exist, returns 404 error', async () => {
      mockReviewService.getConsecutiveStudyDays.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getConsecutiveDays({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('startCramSession', () => {
    it('TC-123: should start cram session when no limit specified, returns default 50 cards', async () => {
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

    it('TC-124: should start cram session when custom limit provided, returns limited cards', async () => {
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

    it('TC-125: should return empty array when deck has no cards, returns empty data', async () => {
      mockStudyService.getCramCards.mockResolvedValue([]);

      const result = await controller.startCramSession(mockUser as any, 1);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('TC-126: should throw NotFoundException when deck does not exist, returns 404 error', async () => {
      mockStudyService.getCramCards.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(
        controller.startCramSession(mockUser as any, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('TC-127: should convert string limit to number when string provided, returns cards', async () => {
      mockStudyService.getCramCards.mockResolvedValue([]);

      await controller.startCramSession(mockUser as any, 1, '25' as any);

      expect(studyService.getCramCards).toHaveBeenCalledWith(
        mockUser.id,
        1,
        25,
      );
    });

    it('TC-128: should use correct user id when user id is 99, returns cards for user 99', async () => {
      const user = { ...mockUser, id: 99 };
      mockStudyService.getCramCards.mockResolvedValue([]);

      await controller.startCramSession(user as any, 1);

      expect(studyService.getCramCards).toHaveBeenCalledWith(99, 1, 50);
    });

    it('TC-129: should use default limit when limit is undefined, returns default cards', async () => {
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
    it('TC-130: should submit cram review when single card reviewed, returns review result', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
      };
      const reviewResult = [
        {
          cardId: 1,
          quality: 'Good',
          previousStatus: 'review',
          newStatus: 'review',
        },
      ];
      mockReviewService.submitCramReviews.mockResolvedValue(reviewResult);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result).toEqual(reviewResult);
      expect(reviewService.submitCramReviews).toHaveBeenCalledWith(submitDto);
    });

    it('TC-131: should submit cram reviews when multiple cards reviewed, returns all results', async () => {
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

    it('TC-132: should not affect card scheduling when cram review submitted, returns same status', async () => {
      const submitDto = {
        CardReviews: [{ cardId: 1, quality: 'Easy' }],
      };
      const reviewResult = [
        {
          cardId: 1,
          previousStatus: 'review',
          newStatus: 'review',
        },
      ];
      mockReviewService.submitCramReviews.mockResolvedValue(reviewResult);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result[0].previousStatus).toBe(result[0].newStatus);
    });

    it('TC-133: should return empty array when CardReviews is empty, returns empty array', async () => {
      const submitDto = { CardReviews: [] };
      mockReviewService.submitCramReviews.mockResolvedValue([]);

      const result = await controller.submitCramReview(submitDto as any);

      expect(result).toEqual([]);
    });

    it('TC-134: should throw error when card does not exist, returns error message', async () => {
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
    it('TC-135: should be defined when module is compiled, returns defined controller', () => {
      expect(controller).toBeDefined();
    });

    it('TC-136: should have reviewService injected when module is compiled, returns defined service', () => {
      expect(reviewService).toBeDefined();
    });

    it('TC-137: should have studyService injected when module is compiled, returns defined service', () => {
      expect(studyService).toBeDefined();
    });
  });
});
