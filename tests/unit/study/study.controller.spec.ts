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
    it('TC-STARTSTUDY-001: This test case aims to verify retrieval of due reviews for a deck', async () => {
      const dueCards = [
        { id: 1, front: 'Card 1', status: 'review' },
        { id: 2, front: 'Card 2', status: 'learning' },
      ];
      mockReviewService.getDueReviews.mockResolvedValue(dueCards);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual(dueCards);
      expect(reviewService.getDueReviews).toHaveBeenCalledWith(1);
    });

    it('TC-STARTSTUDY-002: This test case aims to verify empty array is returned when no cards are due', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      const result = await controller.getDueReviews({ id: 1 });

      expect(result).toEqual([]);
    });

    it('TC-STARTSTUDY-003: This test case aims to verify NotFoundException is thrown for non-existent deck', async () => {
      mockReviewService.getDueReviews.mockRejectedValue(
        new NotFoundException('Deck not found'),
      );

      await expect(controller.getDueReviews({ id: 999 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('TC-STARTSTUDY-004: This test case aims to verify getDueReviews with various deck ids', async () => {
      mockReviewService.getDueReviews.mockResolvedValue([]);

      await controller.getDueReviews({ id: 42 });

      expect(reviewService.getDueReviews).toHaveBeenCalledWith(42);
    });

    it('TC-STARTSTUDY-005: This test case aims to verify retrieval of cards with all status types', async () => {
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
    it('TC-RECORDREVIEW-001: This test case aims to verify submission of single review outcome', async () => {
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

    it('TC-RECORDREVIEW-002: This test case aims to verify submission of multiple review outcomes', async () => {
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

    it('TC-RECORDREVIEW-003: This test case aims to verify handling of all quality types (Again, Hard, Good, Easy)', async () => {
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

    it('TC-RECORDREVIEW-004: This test case aims to verify handling of empty CardReviews array', async () => {
      const submitDto = { CardReviews: [] };
      mockReviewService.submitReviews.mockResolvedValue([]);

      const result = await controller.submitReview(submitDto as any);

      expect(result).toEqual([]);
    });

    it('TC-RECORDREVIEW-005: This test case aims to verify service error propagation during review submission', async () => {
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
    it('TC-STUDYSTATS-001: This test case aims to verify retrieval of consecutive study days statistic', async () => {
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

    it('TC-STUDYSTATS-002: This test case aims to verify zero days is returned when deck was never studied', async () => {
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

    it('TC-STUDYSTATS-003: This test case aims to verify zero days is returned when study streak is broken', async () => {
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

    it('TC-STUDYSTATS-004: This test case aims to verify string id is converted to number', async () => {
      mockReviewService.getConsecutiveStudyDays.mockResolvedValue({
        consecutiveDays: 1,
        streakStartDate: new Date(),
        lastStudyDate: new Date(),
      });

      await controller.getConsecutiveDays({ id: '42' as any });

      expect(reviewService.getConsecutiveStudyDays).toHaveBeenCalledWith(42);
    });

    it('TC-STUDYSTATS-005: This test case aims to verify NotFoundException for statistics of non-existent deck', async () => {
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

  describe('UC-STATISTICS: User Statistics Controller Endpoints', () => {
    beforeEach(() => {
      mockStudyService.getUserStatistics = jest.fn();
      mockStudyService.getUserDailyBreakdown = jest.fn();
      mockStudyService.getRecentActivity = jest.fn();
    });

    describe('getUserStatistics', () => {
      it('TC-CTRL-USERSTATS-001: This test case aims to verify user statistics endpoint returns data', async () => {
        const mockStats = {
          totalCards: 100,
          studiedToday: 10,
          studiedThisWeek: 50,
          studiedThisMonth: 200,
          currentStreak: 5,
          longestStreak: 10,
          averageAccuracy: 85.5,
          totalStudyTime: 3600,
          cardsPerDay: 15,
          bestDay: 'Monday',
          totalDecks: 5,
          totalReviews: 500,
        };
        mockStudyService.getUserStatistics.mockResolvedValue(mockStats);

        const result = await controller.getUserStatistics(mockUser as any, {
          timeRange: undefined,
        });

        expect(result).toEqual(mockStats);
        expect(studyService.getUserStatistics).toHaveBeenCalledWith(
          1,
          undefined,
        );
      });

      it('TC-CTRL-USERSTATS-002: This test case aims to verify time range parameter is passed correctly', async () => {
        mockStudyService.getUserStatistics.mockResolvedValue({});

        await controller.getUserStatistics(mockUser as any, {
          timeRange: 'month' as any,
        });

        expect(studyService.getUserStatistics).toHaveBeenCalledWith(1, 'month');
      });

      it('TC-CTRL-USERSTATS-003: This test case aims to verify error propagation from service', async () => {
        mockStudyService.getUserStatistics.mockRejectedValue(
          new Error('Database error'),
        );

        await expect(
          controller.getUserStatistics(mockUser as any, {
            timeRange: undefined,
          }),
        ).rejects.toThrow('Database error');
      });
    });

    describe('getUserDailyBreakdown', () => {
      it('TC-CTRL-DAILYBREAKDOWN-001: This test case aims to verify daily breakdown endpoint returns data', async () => {
        const mockBreakdown = {
          startDate: '2025-12-16',
          endDate: '2025-12-23',
          dailyBreakdown: [
            {
              date: '2025-12-16',
              dayOfWeek: 'Monday',
              cardsReviewed: 10,
              accuracy: 85,
              studyTime: 100,
              decksStudied: 2,
            },
          ],
          summary: {
            totalCardsReviewed: 10,
            averageAccuracy: 85,
            totalStudyTime: 100,
            daysStudied: 1,
            totalDaysInRange: 7,
          },
        };
        mockStudyService.getUserDailyBreakdown.mockResolvedValue(mockBreakdown);

        const result = await controller.getUserDailyBreakdown(mockUser as any, {
          startDate: '2025-12-16',
          endDate: '2025-12-23',
        });

        expect(result).toEqual(mockBreakdown);
      });

      it('TC-CTRL-DAILYBREAKDOWN-002: This test case aims to verify date parameters are converted to Date objects', async () => {
        mockStudyService.getUserDailyBreakdown.mockResolvedValue({});

        await controller.getUserDailyBreakdown(mockUser as any, {
          startDate: '2025-12-16',
          endDate: '2025-12-23',
        });

        expect(studyService.getUserDailyBreakdown).toHaveBeenCalledWith(
          1,
          expect.any(Date),
          expect.any(Date),
        );
      });

      it('TC-CTRL-DAILYBREAKDOWN-003: This test case aims to verify error propagation from service', async () => {
        mockStudyService.getUserDailyBreakdown.mockRejectedValue(
          new Error('Invalid date range'),
        );

        await expect(
          controller.getUserDailyBreakdown(mockUser as any, {
            startDate: '2025-12-16',
            endDate: '2025-12-23',
          }),
        ).rejects.toThrow('Invalid date range');
      });
    });

    describe('getRecentActivity', () => {
      it('TC-CTRL-RECENTACTIVITY-001: This test case aims to verify recent activity endpoint returns data', async () => {
        const mockActivities = [
          {
            id: 1,
            type: 'study',
            date: '2025-12-23T09:30:00.000Z',
            deckId: 5,
            deckName: 'Test Deck',
            cardsReviewed: 23,
            accuracy: 89.0,
            studyTime: 900,
            newCards: 5,
            reviewCards: 18,
          },
        ];
        mockStudyService.getRecentActivity.mockResolvedValue(mockActivities);

        const result = await controller.getRecentActivity(mockUser as any, {
          limit: 10,
        });

        expect(result).toEqual(mockActivities);
        expect(studyService.getRecentActivity).toHaveBeenCalledWith(1, 10);
      });

      it('TC-CTRL-RECENTACTIVITY-002: This test case aims to verify default limit is used when not provided', async () => {
        mockStudyService.getRecentActivity.mockResolvedValue([]);

        await controller.getRecentActivity(mockUser as any, {});

        expect(studyService.getRecentActivity).toHaveBeenCalledWith(
          1,
          undefined,
        );
      });

      it('TC-CTRL-RECENTACTIVITY-003: This test case aims to verify custom limit is passed correctly', async () => {
        mockStudyService.getRecentActivity.mockResolvedValue([]);

        await controller.getRecentActivity(mockUser as any, { limit: 25 });

        expect(studyService.getRecentActivity).toHaveBeenCalledWith(1, 25);
      });

      it('TC-CTRL-RECENTACTIVITY-004: This test case aims to verify error propagation from service', async () => {
        mockStudyService.getRecentActivity.mockRejectedValue(
          new Error('Service unavailable'),
        );

        await expect(
          controller.getRecentActivity(mockUser as any, { limit: 10 }),
        ).rejects.toThrow('Service unavailable');
      });

      it('TC-CTRL-RECENTACTIVITY-005: This test case aims to verify empty array is returned when no activities', async () => {
        mockStudyService.getRecentActivity.mockResolvedValue([]);

        const result = await controller.getRecentActivity(mockUser as any, {
          limit: 10,
        });

        expect(result).toEqual([]);
      });
    });
  });
});
