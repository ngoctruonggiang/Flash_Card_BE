import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaService } from 'src/services/prisma.service';
import { AnkiScheduler } from 'src/services/scheduler';

// Mock AnkiScheduler
jest.mock('src/services/scheduler');

describe('ReviewService - Cram Mode', () => {
  let service: ReviewService;
  let prismaService: PrismaService;
  let mockAnkiScheduler: any;

  const mockPrismaService = {
    cardReview: {
      create: jest.fn(),
    },
    card: {
      findUnique: jest.fn(),
      update: jest.fn(),
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

  describe('UC-20: Start Study Session - Cram Mode', () => {
    it('should create review logs but NOT update card schedule', async () => {
      const submitDto: any = {
        CardReviews: [{ cardId: 1, quality: 'Good' }],
        reviewedAt: new Date(),
      };

      const mockCard = {
        id: 1,
        status: 'review',
        stepIndex: 0,
        easeFactor: 2.5,
        interval: 10,
        nextReviewDate: new Date('2025-01-01'),
      };

      mockPrismaService.card.findUnique.mockResolvedValue(mockCard);
      mockPrismaService.cardReview.create.mockResolvedValue({
        ...mockCard,
        id: 100,
      });

      await service.submitCramReviews(submitDto);

      // 1. Verify card was fetched
      expect(prismaService.card.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });

      // 2. Verify CardReview was created with existing card data (not new scheduled data)
      expect(prismaService.cardReview.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cardId: 1,
          quality: 'Good',
          interval: mockCard.interval, // Should be same as original
          eFactor: mockCard.easeFactor, // Should be same as original
          previousStatus: mockCard.status,
          newStatus: mockCard.status, // Status should not change
        }),
      });

      // 3. CRITICAL: Verify card.update was NEVER called
      expect(prismaService.card.update).not.toHaveBeenCalled();

      // 4. Verify scheduler was NOT used
      expect(mockAnkiScheduler.calculateNext).not.toHaveBeenCalled();
    });
  });
});
