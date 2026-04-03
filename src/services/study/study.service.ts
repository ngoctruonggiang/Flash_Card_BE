import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Card } from '@prisma/client';
import { StudySessionStatisticsDto } from 'src/utils/types/dto/study/studySessionStatistics.dto';
import { TimeRangeStatisticsDto } from 'src/utils/types/dto/study/timeRangeStatistics.dto';

@Injectable()
export class StudyService {
  constructor(private readonly prismaService: PrismaService) {}

  async getCramCards(userId: number, deckId: number, limit: number = 50) {
    // Verify deck ownership
    const deck = await this.prismaService.deck.findFirst({
      where: { id: deckId, userId },
    });

    if (!deck) {
      throw new NotFoundException('Deck not found');
    }

    // Fetch cards regardless of due date using raw query for randomness
    // Note: Prisma returns raw objects, so we cast to Card[] if needed,
    // but usually it matches the shape.
    const cards = await this.prismaService.$queryRaw<Card[]>`
      SELECT * FROM "Card"
      WHERE "deckId" = ${deckId}
      ORDER BY RANDOM() 
      LIMIT ${limit}
    `;

    return cards;
  }

  async calculateSessionStatistics(
    deckId: number,
    sessionStartTime: Date,
    sessionEndTime: Date,
  ): Promise<StudySessionStatisticsDto> {
    // Get all reviews within the session time range
    const reviews = await this.prismaService.cardReview.findMany({
      where: {
        card: {
          deckId,
        },
        reviewedAt: {
          gte: sessionStartTime,
          lte: sessionEndTime,
        },
      },
      include: {
        card: {
          select: {
            status: true,
          },
        },
      },
    });

    const totalCardsReviewed = reviews.length;

    // Count cards by status before the review
    const newCardsIntroduced = reviews.filter(
      (r) => r.card.status === 'new',
    ).length;
    const learningCardsReviewed = reviews.filter(
      (r) => r.card.status === 'learning',
    ).length;
    const reviewCardsReviewed = reviews.filter(
      (r) => r.card.status === 'review',
    ).length;

    // Count by quality
    const againCount = reviews.filter((r) => r.quality === 'Again').length;
    const hardCount = reviews.filter((r) => r.quality === 'Hard').length;
    const goodCount = reviews.filter((r) => r.quality === 'Good').length;
    const easyCount = reviews.filter((r) => r.quality === 'Easy').length;

    const correctAnswers = goodCount + easyCount;
    const incorrectAnswers = againCount;

    const accuracyPercentage =
      totalCardsReviewed > 0 ? (correctAnswers / totalCardsReviewed) * 100 : 0;

    // Calculate study time
    const totalStudyTime = Math.floor(
      (sessionEndTime.getTime() - sessionStartTime.getTime()) / 1000,
    );

    const averageTimePerCard =
      totalCardsReviewed > 0 ? totalStudyTime / totalCardsReviewed : 0;

    // Get deck info
    const deck = await this.prismaService.deck.findUnique({
      where: { id: deckId },
      select: {
        title: true,
      },
    });

    return {
      totalCardsReviewed,
      newCardsIntroduced,
      learningCardsReviewed,
      reviewCardsReviewed,
      correctAnswers,
      incorrectAnswers,
      accuracyPercentage: parseFloat(accuracyPercentage.toFixed(2)),
      totalStudyTime,
      averageTimePerCard: parseFloat(averageTimePerCard.toFixed(2)),
      againCount,
      hardCount,
      goodCount,
      easyCount,
      sessionStartTime,
      sessionEndTime,
      deckId: deckId.toString(),
      deckName: deck?.title || 'Unknown',
    };
  }

  async getTimeRangeStatistics(
    deckId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<TimeRangeStatisticsDto> {
    // Get all reviews within the time range
    const reviews = await this.prismaService.cardReview.findMany({
      where: {
        card: {
          deckId,
        },
        reviewedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        card: {
          select: {
            status: true,
            interval: true,
          },
        },
      },
      orderBy: {
        reviewedAt: 'asc',
      },
    });

    const totalCardsReviewed = reviews.length;

    // Count quality distribution
    const againCount = reviews.filter((r) => r.quality === 'Again').length;
    const hardCount = reviews.filter((r) => r.quality === 'Hard').length;
    const goodCount = reviews.filter((r) => r.quality === 'Good').length;
    const easyCount = reviews.filter((r) => r.quality === 'Easy').length;

    const correctReviews = goodCount + easyCount;
    const incorrectReviews = againCount;

    const accuracyPercentage =
      totalCardsReviewed > 0 ? (correctReviews / totalCardsReviewed) * 100 : 0;

    // Count new cards introduced and cards matured
    const newCardsIntroduced = reviews.filter(
      (r) => r.card.status === 'new',
    ).length;
    const cardsMatured = reviews.filter(
      (r) => r.card.status === 'review' && r.card.interval >= 21,
    ).length;

    // Group reviews by date
    const reviewsByDate = new Map<
      string,
      { reviewCount: number; studyTime: number }
    >();

    reviews.forEach((review) => {
      const date = review.reviewedAt.toISOString().split('T')[0];
      const existing = reviewsByDate.get(date) || {
        reviewCount: 0,
        studyTime: 0,
      };
      reviewsByDate.set(date, {
        reviewCount: existing.reviewCount + 1,
        studyTime: existing.studyTime + 10, // Estimate 10 seconds per review
      });
    });

    const dailyBreakdown = Array.from(reviewsByDate.entries())
      .map(([date, data]) => ({
        date,
        reviewCount: data.reviewCount,
        studyTime: data.studyTime,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate total study time and sessions
    const totalStudyTime = dailyBreakdown.reduce(
      (sum, day) => sum + day.studyTime,
      0,
    );
    const totalSessions = dailyBreakdown.length;
    const averageSessionTime =
      totalSessions > 0 ? totalStudyTime / totalSessions : 0;

    // Days studied
    const daysStudied = new Set(
      reviews.map((r) => r.reviewedAt.toISOString().split('T')[0]),
    ).size;

    // Total days in range
    const totalDaysInRange = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const consistencyPercentage =
      totalDaysInRange > 0 ? (daysStudied / totalDaysInRange) * 100 : 0;

    // Average reviews per day
    const averageReviewsPerDay =
      totalDaysInRange > 0 ? totalCardsReviewed / totalDaysInRange : 0;

    // Calculate streaks
    const sortedUniqueDates = Array.from(
      new Set(reviews.map((r) => r.reviewedAt.toISOString().split('T')[0])),
    ).sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    // Calculate longest streak
    for (let i = 1; i < sortedUniqueDates.length; i++) {
      const prevDate = new Date(sortedUniqueDates[i - 1]);
      const currDate = new Date(sortedUniqueDates[i]);
      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak from end date
    const endDateStr = endDate.toISOString().split('T')[0];
    if (sortedUniqueDates.includes(endDateStr)) {
      currentStreak = 1;
      for (let i = sortedUniqueDates.length - 2; i >= 0; i--) {
        const currDate = new Date(sortedUniqueDates[i]);
        const nextDate = new Date(sortedUniqueDates[i + 1]);
        const diffDays = Math.floor(
          (nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      startDate,
      endDate,
      totalCardsReviewed,
      totalSessions,
      totalStudyTime,
      averageSessionTime: parseFloat(averageSessionTime.toFixed(2)),
      daysStudied,
      totalDaysInRange,
      consistencyPercentage: parseFloat(consistencyPercentage.toFixed(2)),
      correctReviews,
      incorrectReviews,
      accuracyPercentage: parseFloat(accuracyPercentage.toFixed(2)),
      newCardsIntroduced,
      cardsMatured,
      averageReviewsPerDay: parseFloat(averageReviewsPerDay.toFixed(2)),
      qualityDistribution: {
        Again: againCount,
        Hard: hardCount,
        Good: goodCount,
        Easy: easyCount,
      },
      dailyBreakdown,
      currentStreak,
      longestStreak,
    };
  }
}
