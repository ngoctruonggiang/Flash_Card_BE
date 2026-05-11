import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { Card, CardReview, ReviewQuality } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ReviewPreviewDto } from 'src/utils/types/dto/review/previewReview.dto';
import { ConsecutiveDaysDto } from 'src/utils/types/dto/review/consecutiveDays.dto';
import { AnkiScheduler, Rating, SchedulerCard } from '../scheduler';

@Injectable()
export class ReviewService {
  constructor(private readonly prismaService: PrismaService) {}

  async updateReview(cardReview: CardReview) {
    return this.prismaService.cardReview.update({
      where: { id: cardReview.id },
      data: cardReview,
    });
  }
  async removeByCardId(cardId: number) {
    return this.prismaService.cardReview.deleteMany({
      where: { cardId },
    });
  }

  async addReview(cardReview: CardReview) {
    return this.prismaService.cardReview.create({
      data: {
        cardId: cardReview.cardId,
        quality: cardReview.quality,
        repetitions: cardReview.repetitions,
        interval: cardReview.interval,
        eFactor: cardReview.eFactor,
        nextReviewDate: cardReview.nextReviewDate,
        reviewedAt: cardReview.reviewedAt,
        previousStatus: cardReview.previousStatus,
        newStatus: cardReview.newStatus,
      },
    });
  }

  async getLastestReviewByCardId(cardId: number): Promise<CardReview | null> {
    return this.prismaService.cardReview.findFirst({
      where: { cardId },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  /**
   * [FACADE] — Chuyển đổi Card entity thành SchedulerCard input.
   * Encapsulate mapping logic, giảm coupling giữa DB schema và Scheduler interface.
   */
  private toSchedulerInput(card: Card): SchedulerCard {
    return {
      status: card.status,
      stepIndex: card.stepIndex,
      easeFactor: card.easeFactor,
      interval: card.interval,
    };
  }

  /**
   * UC-21: Record Review Outcome — Submit batch review results.
   * Đã refactor: Unit of Work (single transaction) + Facade (scheduler helper)
   * + ownership check + actual review IDs.
   *
   * @param review - DTO chứa mảng CardReviews
   * @param userId - ID của user hiện tại (từ JWT token)
   * @throws NotFoundException - Nếu card không tồn tại
   * @throws ForbiddenException - Nếu user không sở hữu card/deck
   */
  async submitReviews(review: SubmitReviewDto, userId: number) {
    const scheduler = new AnkiScheduler();
    // ĐÚNG — DTO không có reviewedAt, dùng server-side timestamp
    const now = new Date();

    // ──── BƯỚC 1: Batch fetch tất cả cards cần review ────
    const cardIds = review.CardReviews.map((r) => r.cardId);
    const cards = await this.prismaService.card.findMany({
      where: { id: { in: cardIds } },
      include: { deck: { select: { userId: true } } },
    });

    // ──── BƯỚC 2: Validate existence + ownership ────
    const cardMap = new Map(cards.map((c) => [c.id, c]));

    for (const r of review.CardReviews) {
      const card = cardMap.get(r.cardId);
      if (!card) {
        throw new NotFoundException(`Card with id ${r.cardId} not found`);
      }
      // AUTH-CHECK [UC-21]: Verify user sở hữu deck chứa card
      if (card.deck.userId !== userId) {
        throw new ForbiddenException(
          `You do not have permission to review card ${r.cardId}`,
        );
      }
    }

    // ──── BƯỚC 3: UNIT OF WORK — Single interactive transaction ────
    const results = await this.prismaService.$transaction(async (tx) => {
      const reviewResults: CardReview[] = [];

      for (const r of review.CardReviews) {
        const card = cardMap.get(r.cardId)!;

        // FACADE: Convert Card → SchedulerCard
        const schedulerInput = this.toSchedulerInput(card);
        const rating = r.quality as Rating;
        const nextState = scheduler.calculateNext(schedulerInput, rating);

        // Update card state
        await tx.card.update({
          where: { id: card.id },
          data: {
            status: nextState.status,
            stepIndex: nextState.stepIndex,
            easeFactor: nextState.easeFactor,
            interval: nextState.interval,
            nextReviewDate: nextState.nextReviewDate,
          },
        });

        // Create review record — trả về actual ID (không còn mock id: 0)
        const createdReview = await tx.cardReview.create({
          data: {
            cardId: card.id,
            quality: r.quality,
            // NOTE: Giữ nguyên behavior gốc — AnkiScheduler không expose
            // repetitions count ra ngoài nextState. stepIndex trên Card entity
            // được dùng thay thế để track vị trí trong learning steps.
            // Thay đổi field này cần đồng bộ với scheduler.ts — ngoài scope.
            repetitions: 0,
            interval: nextState.interval,
            eFactor: nextState.easeFactor,
            nextReviewDate: nextState.nextReviewDate || now,
            reviewedAt: now,
            previousStatus: card.status,
            newStatus: nextState.status,
          },
        });

        reviewResults.push(createdReview);
      }

      return reviewResults;
    });

    return results;
  }

  async submitCramReviews(review: SubmitReviewDto) {
    const results: CardReview[] = [];
    const now = new Date();

    for (const r of review.CardReviews) {
      const card = await this.prismaService.card.findUnique({
        where: { id: r.cardId },
      });

      if (!card) {
        throw new NotFoundException(`Card with id ${r.cardId} not found`);
      }

      // Create review record but DO NOT update card schedule
      // This allows the review to count towards study streaks
      const cardReview = await this.prismaService.cardReview.create({
        data: {
          cardId: card.id,
          quality: r.quality,
          repetitions: 0,
          interval: card.interval,
          eFactor: card.easeFactor,
          nextReviewDate: card.nextReviewDate || now,
          reviewedAt: review.reviewedAt || now,
          previousStatus: card.status,
          newStatus: card.status,
        },
      });
      results.push(cardReview);
    }

    return results;
  }

  /**
   * [SPECIFICATION PATTERN] — Xây dựng Prisma where clause cho due cards.
   * Tách riêng để dễ test, dễ mở rộng (VD: thêm tag filter, new card limit).
   * Được gọi bởi getDueReviews() — UC-20.
   */
  private buildDueCardsSpec(deckId: number, now: Date) {
    return {
      deckId,
      OR: [
        // Cards đã review và đến hạn
        { nextReviewDate: { lte: now } },
        // Cards mới chưa bao giờ review
        { status: 'new' as const },
        // Cards đang học và đến hạn
        { status: 'learning' as const, nextReviewDate: { lte: now } },
        // Cards đang học lại và đến hạn
        { status: 'relearning' as const, nextReviewDate: { lte: now } },
      ],
    };
  }

  /**
   * UC-20: Start Study Session — Lấy danh sách thẻ đến hạn ôn tập.
   * Đã refactor: thêm ownership check + Specification Pattern.
   *
   * @param deckId - ID của deck cần lấy thẻ
   * @param userId - ID của user hiện tại (từ JWT token)
   * @param limit - Số thẻ tối đa trả về (optional)
   * @throws NotFoundException - Nếu deck không tồn tại
   * @throws ForbiddenException - Nếu user không sở hữu deck
   */
  async getDueReviews(deckId: number, userId: number, limit?: number): Promise<Card[]> {
    // AUTH-CHECK [UC-20]: Verify ownership — dùng findFirst thay vì findUnique để check cả id + userId
    const deck = await this.prismaService.deck.findFirst({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found or access denied');
    }

    const now = new Date();

    // SPECIFICATION PATTERN: Delegate query construction
    const whereSpec = this.buildDueCardsSpec(deckId, now);

    const cards = await this.prismaService.card.findMany({
      where: whereSpec,
      take: limit,
      orderBy: { nextReviewDate: 'asc' },
    });

    return cards;
  }

  async getReviewPreview(cardId: number): Promise<ReviewPreviewDto> {
    const card = await this.prismaService.card.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    const scheduler = new AnkiScheduler();
    const input: SchedulerCard = {
      status: card.status,
      stepIndex: card.stepIndex,
      easeFactor: card.easeFactor,
      interval: card.interval,
    };

    const qualities: Rating[] = ['Again', 'Hard', 'Good', 'Easy'];
    const previews: Partial<ReviewPreviewDto> = {};

    const formatIvl = (c: SchedulerCard) => {
      if (c.status === 'learning' || c.status === 'relearning') {
        return `${Math.round(c.interval)} min`;
      }
      const days = Math.round(c.interval);
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    };

    for (const quality of qualities) {
      const result = scheduler.calculateNext(input, quality);
      previews[quality] = formatIvl(result);
    }

    return previews as ReviewPreviewDto;
  }

  async getConsecutiveStudyDays(deckId: number): Promise<ConsecutiveDaysDto> {
    // Check if deck exists
    const deck = await this.prismaService.deck.findUnique({
      where: { id: deckId },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    // Get all cards for the deck
    const cards = await this.prismaService.card.findMany({
      where: { deckId },
      select: { id: true },
    });

    if (cards.length === 0) {
      return {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      };
    }

    const cardIds = cards.map((card) => card.id);

    // Get all reviews for the deck's cards, ordered by date
    const reviews = await this.prismaService.cardReview.findMany({
      where: {
        cardId: { in: cardIds },
      },
      orderBy: { reviewedAt: 'desc' },
      select: { reviewedAt: true },
    });

    if (reviews.length === 0) {
      return {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      };
    }

    // Helper function to normalize date to start of day (UTC)
    const normalizeDate = (date: Date): string => {
      const d = new Date(date);
      return new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
      ).toISOString();
    };

    // Get unique study dates (normalized to day level)
    const studyDatesSet = new Set<string>();
    reviews.forEach((review) => {
      studyDatesSet.add(normalizeDate(review.reviewedAt));
    });

    // Convert to sorted array (most recent first)
    const studyDates = Array.from(studyDatesSet)
      .sort()
      .reverse()
      .map((dateStr) => new Date(dateStr));

    if (studyDates.length === 0) {
      return {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      };
    }

    const lastStudyDate = studyDates[0];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if the streak is current (studied today or yesterday)
    const daysSinceLastStudy = Math.floor(
      (today.getTime() - lastStudyDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceLastStudy > 1) {
      // Streak is broken
      return {
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate,
      };
    }

    // Calculate consecutive days
    let consecutiveDays = 1;
    let streakStartDate = lastStudyDate;

    for (let i = 1; i < studyDates.length; i++) {
      const currentDate = studyDates[i];
      const previousDate = studyDates[i - 1];

      const dayDifference = Math.floor(
        (previousDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (dayDifference === 1) {
        consecutiveDays++;
        streakStartDate = currentDate;
      } else {
        break;
      }
    }

    return {
      consecutiveDays,
      streakStartDate,
      lastStudyDate,
    };
  }
}
