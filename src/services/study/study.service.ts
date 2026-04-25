import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Card } from '@prisma/client';
import { StudySessionStatisticsDto } from 'src/utils/types/dto/study/studySessionStatistics.dto';
import { TimeRangeStatisticsDto } from 'src/utils/types/dto/study/timeRangeStatistics.dto';
import {
  TimeRange,
  UserStatisticsDto,
} from 'src/utils/types/dto/study/userStatistics.dto';
import { UserDailyBreakdownDto } from 'src/utils/types/dto/study/userDailyBreakdown.dto';
import { RecentActivityItemDto } from 'src/utils/types/dto/study/recentActivity.dto';

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

  /**
   * Get comprehensive statistics for the current user across all their decks.
   */
  async getUserStatistics(
    userId: number,
    timeRange: TimeRange = TimeRange.WEEK,
  ): Promise<UserStatisticsDto> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    // Get all user's decks
    const userDecks = await this.prismaService.deck.findMany({
      where: { userId },
      select: { id: true },
    });
    const deckIds = userDecks.map((d) => d.id);

    // Total cards count
    const totalCards = await this.prismaService.card.count({
      where: { deckId: { in: deckIds } },
    });

    // Total decks count
    const totalDecks = userDecks.length;

    // Get all reviews for user's cards
    const allReviews = await this.prismaService.cardReview.findMany({
      where: {
        card: { deckId: { in: deckIds } },
      },
      include: {
        card: {
          select: { id: true, deckId: true },
        },
      },
      orderBy: { reviewedAt: 'asc' },
    });

    const totalReviews = allReviews.length;

    // Studied today (unique cards)
    const todayReviews = allReviews.filter((r) => r.reviewedAt >= todayStart);
    const studiedToday = new Set(todayReviews.map((r) => r.cardId)).size;

    // Studied this week (unique cards)
    const weekReviews = allReviews.filter((r) => r.reviewedAt >= weekAgo);
    const studiedThisWeek = new Set(weekReviews.map((r) => r.cardId)).size;

    // Studied this month (unique cards)
    const monthReviews = allReviews.filter((r) => r.reviewedAt >= monthAgo);
    const studiedThisMonth = new Set(monthReviews.map((r) => r.cardId)).size;

    // Calculate accuracy (quality >= Hard is considered correct)
    const correctReviews = allReviews.filter(
      (r) =>
        r.quality === 'Hard' || r.quality === 'Good' || r.quality === 'Easy',
    ).length;
    const averageAccuracy =
      totalReviews > 0
        ? parseFloat(((correctReviews / totalReviews) * 100).toFixed(1))
        : 0;

    // Total study time (estimated: 10 seconds per review)
    const totalStudyTime = totalReviews * 10;

    // Cards per day (last 30 days)
    const cardsPerDay =
      monthReviews.length > 0
        ? parseFloat((monthReviews.length / 30).toFixed(1))
        : 0;

    // Calculate streaks
    const studyDates = Array.from(
      new Set(allReviews.map((r) => r.reviewedAt.toISOString().split('T')[0])),
    ).sort();

    const { currentStreak, longestStreak } = this.calculateStreaks(
      studyDates,
      now,
    );

    // Best day calculation (day with highest average reviews)
    const bestDay = this.calculateBestDay(allReviews);

    return {
      totalCards,
      studiedToday,
      studiedThisWeek,
      studiedThisMonth,
      currentStreak,
      longestStreak,
      averageAccuracy,
      totalStudyTime,
      cardsPerDay,
      bestDay,
      totalDecks,
      totalReviews,
    };
  }

  /**
   * Get daily statistics for the user within a time range, aggregated across all decks.
   */
  async getUserDailyBreakdown(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<UserDailyBreakdownDto> {
    // Normalize dates to cover full days
    const normalizedStartDate = new Date(startDate);
    normalizedStartDate.setHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setHours(23, 59, 59, 999);

    // Get all user's decks
    const userDecks = await this.prismaService.deck.findMany({
      where: { userId },
      select: { id: true },
    });
    const deckIds = userDecks.map((d) => d.id);

    // Get all reviews in the date range
    const reviews = await this.prismaService.cardReview.findMany({
      where: {
        card: { deckId: { in: deckIds } },
        reviewedAt: {
          gte: normalizedStartDate,
          lte: normalizedEndDate,
        },
      },
      include: {
        card: {
          select: { deckId: true },
        },
      },
      orderBy: { reviewedAt: 'asc' },
    });

    // Helper function to get local date string (YYYY-MM-DD)
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Group reviews by date
    const reviewsByDate = new Map<
      string,
      {
        reviews: typeof reviews;
        decks: Set<number>;
      }
    >();

    reviews.forEach((review) => {
      const dateStr = getLocalDateString(review.reviewedAt);
      const existing = reviewsByDate.get(dateStr) || {
        reviews: [],
        decks: new Set<number>(),
      };
      existing.reviews.push(review);
      existing.decks.add(review.card.deckId);
      reviewsByDate.set(dateStr, existing);
    });

    // Generate all dates in range
    const dailyBreakdown: {
      date: string;
      dayOfWeek: string;
      cardsReviewed: number;
      accuracy: number;
      studyTime: number;
      decksStudied: number;
    }[] = [];
    const currentDate = new Date(normalizedStartDate);
    const endDateTime = normalizedEndDate.getTime();

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    while (currentDate.getTime() <= endDateTime) {
      const dateStr = getLocalDateString(currentDate);
      const dayOfWeek = dayNames[currentDate.getDay()];
      const dayData = reviewsByDate.get(dateStr);

      if (dayData && dayData.reviews.length > 0) {
        const correctCount = dayData.reviews.filter(
          (r) =>
            r.quality === 'Hard' ||
            r.quality === 'Good' ||
            r.quality === 'Easy',
        ).length;
        const accuracy =
          dayData.reviews.length > 0
            ? parseFloat(
                ((correctCount / dayData.reviews.length) * 100).toFixed(1),
              )
            : 0;

        dailyBreakdown.push({
          date: dateStr,
          dayOfWeek,
          cardsReviewed: dayData.reviews.length,
          accuracy,
          studyTime: dayData.reviews.length * 10, // 10 seconds per review
          decksStudied: dayData.decks.size,
        });
      } else {
        dailyBreakdown.push({
          date: dateStr,
          dayOfWeek,
          cardsReviewed: 0,
          accuracy: 0,
          studyTime: 0,
          decksStudied: 0,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const totalCardsReviewed = reviews.length;
    const correctReviews = reviews.filter(
      (r) =>
        r.quality === 'Hard' || r.quality === 'Good' || r.quality === 'Easy',
    ).length;
    const averageAccuracy =
      totalCardsReviewed > 0
        ? parseFloat(((correctReviews / totalCardsReviewed) * 100).toFixed(1))
        : 0;
    const totalStudyTime = totalCardsReviewed * 10;
    const daysStudied = reviewsByDate.size;
    const totalDaysInRange = dailyBreakdown.length;

    return {
      startDate: getLocalDateString(startDate),
      endDate: getLocalDateString(endDate),
      dailyBreakdown,
      summary: {
        totalCardsReviewed,
        averageAccuracy,
        totalStudyTime,
        daysStudied,
        totalDaysInRange,
      },
    };
  }

  /**
   * Get the user's most recent study activities across all decks.
   */
  async getRecentActivity(
    userId: number,
    limit: number = 10,
  ): Promise<RecentActivityItemDto[]> {
    // Get all user's decks with their creation dates
    const userDecks = await this.prismaService.deck.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const deckIds = userDecks.map((d) => d.id);
    const deckMap = new Map(userDecks.map((d) => [d.id, d]));

    // Get reviews grouped by deck and date (study sessions)
    const reviews = await this.prismaService.cardReview.findMany({
      where: {
        card: { deckId: { in: deckIds } },
      },
      include: {
        card: {
          select: { deckId: true },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });

    // Group reviews into study sessions (by deck and date)
    const sessionMap = new Map<
      string,
      {
        deckId: number;
        date: Date;
        reviews: typeof reviews;
        newCards: number;
        reviewCards: number;
      }
    >();

    reviews.forEach((review) => {
      const dateStr = review.reviewedAt.toISOString().split('T')[0];
      const key = `${review.card.deckId}-${dateStr}`;
      const existing = sessionMap.get(key) || {
        deckId: review.card.deckId,
        date: review.reviewedAt,
        reviews: [],
        newCards: 0,
        reviewCards: 0,
      };

      existing.reviews.push(review);
      if (review.previousStatus === 'new') {
        existing.newCards++;
      } else {
        existing.reviewCards++;
      }

      // Keep the earliest review time for the session date
      if (review.reviewedAt < existing.date) {
        existing.date = review.reviewedAt;
      }

      sessionMap.set(key, existing);
    });

    // Convert sessions to activity items
    const studyActivities: RecentActivityItemDto[] = Array.from(
      sessionMap.values(),
    ).map((session, index) => {
      const deck = deckMap.get(session.deckId);
      const correctCount = session.reviews.filter(
        (r) =>
          r.quality === 'Hard' || r.quality === 'Good' || r.quality === 'Easy',
      ).length;
      const accuracy =
        session.reviews.length > 0
          ? parseFloat(
              ((correctCount / session.reviews.length) * 100).toFixed(1),
            )
          : 0;

      return {
        id: index + 1,
        type: 'study' as const,
        date: session.date.toISOString(),
        deckId: session.deckId,
        deckName: deck?.title || 'Unknown',
        cardsReviewed: session.reviews.length,
        accuracy,
        studyTime: session.reviews.length * 10,
        newCards: session.newCards,
        reviewCards: session.reviewCards,
      };
    });

    // Add deck creation events
    const deckCreationActivities: RecentActivityItemDto[] = userDecks.map(
      (deck, index) => ({
        id: studyActivities.length + index + 1,
        type: 'deck_created' as const,
        date: deck.createdAt.toISOString(),
        deckId: deck.id,
        deckName: deck.title,
        cardsReviewed: 0,
        accuracy: 0,
        studyTime: 0,
        newCards: 0,
        reviewCards: 0,
      }),
    );

    // Combine and sort by date descending
    const allActivities = [...studyActivities, ...deckCreationActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

    // Re-assign sequential IDs
    return allActivities.map((activity, index) => ({
      ...activity,
      id: index + 1,
    }));
  }

  /**
   * Helper method to calculate current and longest streaks.
   */
  private calculateStreaks(
    sortedDates: string[],
    referenceDate: Date,
  ): { currentStreak: number; longestStreak: number } {
    if (sortedDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    let longestStreak = 1;
    let tempStreak = 1;

    // Calculate longest streak
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
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

    // Calculate current streak from reference date
    const todayStr = referenceDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(referenceDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    let currentStreak = 0;

    // Check if studied today or yesterday (to allow for current streak)
    const lastStudyDate = sortedDates[sortedDates.length - 1];
    if (lastStudyDate === todayStr || lastStudyDate === yesterdayStr) {
      currentStreak = 1;

      // Count backwards from the last study date
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const currDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);
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

    return { currentStreak, longestStreak };
  }

  /**
   * Helper method to calculate the best day of the week for studying.
   */
  private calculateBestDay(reviews: { reviewedAt: Date }[]): string {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    const dayCount = new Map<number, number>();

    reviews.forEach((review) => {
      const day = review.reviewedAt.getDay();
      dayCount.set(day, (dayCount.get(day) || 0) + 1);
    });

    if (dayCount.size === 0) {
      return 'N/A';
    }

    let bestDayIndex = 0;
    let maxCount = 0;

    dayCount.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        bestDayIndex = day;
      }
    });

    return dayNames[bestDayIndex];
  }
}
