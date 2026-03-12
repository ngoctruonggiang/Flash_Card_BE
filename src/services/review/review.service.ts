import { Injectable } from '@nestjs/common';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { applySm2 } from './sm2Algo';
import { Card, CardReview, ReviewQuality } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { ReviewPreviewDto } from 'src/utils/types/dto/review/previewReview.dto';
import { ConsecutiveDaysDto } from 'src/utils/types/dto/review/consecutiveDays.dto';

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
      },
    });
  }

  async getLastestReviewByCardId(cardId: number): Promise<CardReview | null> {
    return this.prismaService.cardReview.findFirst({
      where: { cardId },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  async submitReviews(review: SubmitReviewDto) {
    const sm2Results: CardReview[] = [];
    for (const r of review.CardReviews) {
      const lastCardReview = await this.getLastestReviewByCardId(r.cardId);
      const result = applySm2(r, new Date(review.reviewedAt), lastCardReview);
      sm2Results.push(result);
    }

    // Use a transaction to persist all reviews atomically
    const creates = sm2Results.map((r) =>
      this.prismaService.cardReview.create({
        data: {
          ...r,
          id: undefined, // Ensure ID is not set
        },
      }),
    );

    return this.prismaService.$transaction(creates);
  }

  async getDueReviews(deckId: number, limit?: number): Promise<Card[]> {
    const today = new Date();

    const cards = await this.prismaService.card.findMany({
      where: {
        deckId,
        OR: [
          // has reviews that are due
          {
            reviews: {
              some: {
                nextReviewDate: { lte: today },
              },
            },
          },
          // never reviewed
          {
            reviews: {
              none: {},
            },
          },
        ],
      },
      take: limit,
      include: {
        reviews: {
          take: 1,
          orderBy: { nextReviewDate: 'asc' },
        },
      },
    });

    // WTF?
    cards.sort((a, b) => {
      const minNext = (c: Card & { reviews: CardReview[] }) => {
        if (!c.reviews || c.reviews.length === 0)
          return Number.POSITIVE_INFINITY;
        return Math.min(
          ...c.reviews.map((r) =>
            r.nextReviewDate
              ? new Date(r.nextReviewDate).getTime()
              : Number.POSITIVE_INFINITY,
          ),
        );
      };

      return minNext(a) - minNext(b);
    });
    return cards.map((c) => ({ ...c, reviews: undefined }) as Card);
  }

  async getReviewPreview(cardId: number): Promise<ReviewPreviewDto> {
    const lastReview = await this.getLastestReviewByCardId(cardId);
    const now = new Date();

    const qualities: ReviewQuality[] = ['Again', 'Hard', 'Good', 'Easy'];
    const previews: Partial<ReviewPreviewDto> = {};

    for (const quality of qualities) {
      const submitReview = { cardId, quality };
      const result = applySm2(submitReview, new Date(now), lastReview);

      const interval = result.interval;
      previews[quality] = interval === 1 ? '1 day' : `${interval} days`;
    }

    return previews as ReviewPreviewDto;
  }

  async getConsecutiveStudyDays(deckId: number): Promise<ConsecutiveDaysDto> {
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
