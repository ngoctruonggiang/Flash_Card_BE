import { Injectable, NotFoundException } from '@nestjs/common';
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

  async submitReviews(review: SubmitReviewDto) {
    const scheduler = new AnkiScheduler();
    const results: CardReview[] = [];

    // Process each review sequentially (or parallel if independent)
    for (const r of review.CardReviews) {
      // 1. Fetch current card state
      const card = await this.prismaService.card.findUnique({
        where: { id: r.cardId },
      });

      if (!card) continue;

      // 2. Prepare scheduler input
      const schedulerInput: SchedulerCard = {
        status: card.status,
        stepIndex: card.stepIndex,
        easeFactor: card.easeFactor,
        interval: card.interval,
      };

      // 3. Calculate next state
      const rating = r.quality as Rating; // Ensure type match
      const nextState = scheduler.calculateNext(schedulerInput, rating);

      // 4. Update Card and Create Review in a transaction
      // We'll do this one by one to ensure consistency, or batch them if needed.
      // For now, let's just collect the promises and execute them.
      // But wait, we need to return the results.

      // Let's execute immediately for simplicity and correctness
      const now = new Date();

      await this.prismaService.$transaction([
        this.prismaService.card.update({
          where: { id: card.id },
          data: {
            status: nextState.status,
            stepIndex: nextState.stepIndex,
            easeFactor: nextState.easeFactor,
            interval: nextState.interval,
            nextReviewDate: nextState.nextReviewDate,
          },
        }),
        this.prismaService.cardReview.create({
          data: {
            cardId: card.id,
            quality: r.quality,
            repetitions: 0, // Deprecated/Legacy
            interval: nextState.interval,
            eFactor: nextState.easeFactor,
            nextReviewDate: nextState.nextReviewDate || now, // Fallback if null (shouldn't happen for active cards)
            reviewedAt: now,
            previousStatus: card.status,
            newStatus: nextState.status,
          },
        }),
      ]);

      // Add to results for response (mocking the review object)
      results.push({
        id: 0,
        cardId: card.id,
        quality: r.quality,
        repetitions: 0,
        interval: nextState.interval,
        eFactor: nextState.easeFactor,
        nextReviewDate: nextState.nextReviewDate || now,
        reviewedAt: now,
        previousStatus: card.status,
        newStatus: nextState.status,
      });
    }

    return results;
  }

  async submitCramReviews(review: SubmitReviewDto) {
    const results: CardReview[] = [];
    const now = new Date();

    for (const r of review.CardReviews) {
      const card = await this.prismaService.card.findUnique({
        where: { id: r.cardId },
      });

      if (!card) continue;

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

  async getDueReviews(deckId: number, limit?: number): Promise<Card[]> {
    const today = new Date();

    const cards = await this.prismaService.card.findMany({
      where: {
        deckId,
        OR: [
          // has reviews that are due
          {
            nextReviewDate: { lte: today },
          },
          // never reviewed (new cards)
          {
            status: 'new',
          },
          // learning cards (often due immediately)
          {
            status: 'learning',
            nextReviewDate: { lte: today },
          },
          {
            status: 'relearning',
            nextReviewDate: { lte: today },
          },
        ],
      },
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
