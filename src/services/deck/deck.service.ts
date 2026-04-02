import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';
import { DeckStatisticsDto } from 'src/utils/types/dto/deck/deckStatistics.dto';
import { AdvancedDeckStatisticsDto } from 'src/utils/types/dto/deck/advancedDeckStatistics.dto';
import { ReviewQuality, LanguageMode } from '@prisma/client';

@Injectable()
export class DeckService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: CreateDeckDto) {
    return await this.prisma.deck.create({
      data: {
        title: data.title,
        description: data.description,
        iconName: data.iconName,
        colorCode: data.colorCode,
        languageMode: data.languageMode || 'VN_EN',
        userId: userId,
      },
    });
  }

  async findAll() {
    const decks = await this.prisma.deck.findMany({
      include: {
        user: true,
        cards: true,
      },
    });

    // Parse examples JSON for cards
    return decks.map((deck) => ({
      ...deck,
      cards: deck.cards.map((card) => ({
        ...card,
        examples: card.examples ? JSON.parse(card.examples) : null,
      })),
    }));
  }

  async findOne(id: number) {
    try {
      const deck = await this.prisma.deck.findUnique({
        where: { id },
        include: {
          user: true,
          cards: {
            include: {
              reviews: true,
            },
          },
        },
      });

      if (!deck) return null;

      return {
        ...deck,
        cards: deck.cards.map((card) => ({
          ...card,
          examples: card.examples ? JSON.parse(card.examples) : null,
        })),
      };
    } catch (error) {
      console.error('Error finding deck:', error);
      throw error;
    }
  }

  async findByUser(userId: number) {
    const decks = await this.prisma.deck.findMany({
      where: { userId },
      include: {
        cards: true,
      },
    });

    // Parse examples JSON for cards
    return decks.map((deck) => ({
      ...deck,
      cards: deck.cards.map((card) => ({
        ...card,
        examples: card.examples ? JSON.parse(card.examples) : null,
      })),
    }));
  }

  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
      iconName?: string;
      colorCode?: string;
      languageMode?: LanguageMode;
    },
  ) {
    return await this.prisma.deck.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // First, get all cards in the deck
    const cards = await this.prisma.card.findMany({
      where: { deckId: id },
      select: { id: true },
    });

    // Delete all reviews for each card
    if (cards.length > 0) {
      await this.prisma.cardReview.deleteMany({
        where: {
          cardId: {
            in: cards.map((card) => card.id),
          },
        },
      });
    }

    // Then delete all cards in the deck
    await this.prisma.card.deleteMany({
      where: { deckId: id },
    });

    // Finally, delete the deck itself
    return await this.prisma.deck.delete({
      where: { id },
    });
  }

  async getReviewedCardsCountInDay(deckId: number, date: Date) {
    // Set date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all cards in the deck
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: {
          include: {
            reviews: {
              where: {
                reviewedAt: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new Error(`Deck with id ${deckId} not found`);
    }

    // Count unique cards that have at least one review in the specified day
    const reviewedCards = deck.cards.filter((card) => card.reviews.length > 0);

    return {
      deckId: deckId,
      date: date.toISOString().split('T')[0],
      reviewedCount: reviewedCards.length,
      totalCards: deck.cards.length,
    };
  }

  async getCardsDueToday(deckId: number) {
    const now = new Date();

    // Get all cards in the deck with their latest review
    const cards = await this.prisma.card.findMany({
      where: {
        deckId,
        OR: [
          // Cards that have reviews due now or earlier
          {
            reviews: {
              some: {
                nextReviewDate: { lte: now },
              },
            },
          },
          // Cards that have never been reviewed
          {
            reviews: {
              none: {},
            },
          },
        ],
      },
      include: {
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Sort cards by next review date (cards never reviewed come first)
    const sortedCards = cards.sort((a, b) => {
      const aNextReview = a.reviews[0]?.nextReviewDate;
      const bNextReview = b.reviews[0]?.nextReviewDate;

      if (!aNextReview && !bNextReview) return 0;
      if (!aNextReview) return -1;
      if (!bNextReview) return 1;

      return new Date(aNextReview).getTime() - new Date(bNextReview).getTime();
    });

    // Return cards without the reviews array to keep response clean
    // Parse examples JSON string to object for each card
    return sortedCards.map((card) => {
      const { reviews, ...cardData } = card;
      return {
        ...cardData,
        nextReviewDate: reviews[0]?.nextReviewDate || null,
        examples: cardData.examples ? JSON.parse(cardData.examples) : null,
      };
    });
  }

  async getDeckStatistics(deckId: number): Promise<DeckStatisticsDto> {
    // Get all reviews for all cards in the deck
    const reviews = await this.prisma.cardReview.findMany({
      where: {
        card: {
          deckId,
        },
      },
      select: {
        quality: true,
      },
    });

    const totalReviews = reviews.length;

    // Count reviews by quality
    const againCount = reviews.filter(
      (r) => r.quality === ReviewQuality.Again,
    ).length;
    const hardCount = reviews.filter(
      (r) => r.quality === ReviewQuality.Hard,
    ).length;
    const goodCount = reviews.filter(
      (r) => r.quality === ReviewQuality.Good,
    ).length;
    const easyCount = reviews.filter(
      (r) => r.quality === ReviewQuality.Easy,
    ).length;

    // Correct reviews are Hard, Good, and Easy (quality >= 3)
    const correctReviews = hardCount + goodCount + easyCount;

    // Calculate percentage
    const correctPercentage =
      totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    return {
      totalReviews,
      correctReviews,
      correctPercentage: parseFloat(correctPercentage.toFixed(2)),
      againCount,
      hardCount,
      goodCount,
      easyCount,
    };
  }

  async getLastStudiedDate(deckId: number) {
    // Get the most recent review for any card in the deck
    const latestReview = await this.prisma.cardReview.findFirst({
      where: {
        card: {
          deckId,
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
      select: {
        reviewedAt: true,
      },
    });

    return {
      deckId,
      lastStudiedAt: latestReview?.reviewedAt || null,
    };
  }

  async getAdvancedStatistics(
    deckId: number,
  ): Promise<AdvancedDeckStatisticsDto> {
    const now = new Date();

    // Get all cards in the deck with their reviews
    const cards = await this.prisma.card.findMany({
      where: { deckId },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'desc',
          },
        },
      },
    });

    const totalCards = cards.length;

    // Card distribution by status
    const newCards = cards.filter((c) => c.status === 'new').length;
    const learningCards = cards.filter((c) => c.status === 'learning').length;
    const reviewCards = cards.filter((c) => c.status === 'review').length;
    const relearningCards = cards.filter(
      (c) => c.status === 'relearning',
    ).length;

    // Mature and young cards (based on interval >= 21 days)
    const matureCards = cards.filter(
      (c) => c.status === 'review' && c.interval >= 21,
    ).length;
    const youngCards = cards.filter(
      (c) => c.status === 'review' && c.interval < 21,
    ).length;

    // Cards due today and next week
    const cardsDueToday = cards.filter(
      (c) => c.nextReviewDate && c.nextReviewDate <= now,
    ).length;

    const nextWeekDate = new Date(now);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const cardsDueNextWeek = cards.filter(
      (c) =>
        c.nextReviewDate &&
        c.nextReviewDate > now &&
        c.nextReviewDate <= nextWeekDate,
    ).length;

    // Get all reviews for the deck
    const allReviews = await this.prisma.cardReview.findMany({
      where: {
        card: {
          deckId,
        },
      },
      select: {
        quality: true,
        reviewedAt: true,
      },
    });

    const totalReviews = allReviews.length;

    // Quality distribution
    const againCount = allReviews.filter((r) => r.quality === 'Again').length;
    const hardCount = allReviews.filter((r) => r.quality === 'Hard').length;
    const goodCount = allReviews.filter((r) => r.quality === 'Good').length;
    const easyCount = allReviews.filter((r) => r.quality === 'Easy').length;

    const correctReviews = goodCount + easyCount;
    const correctPercentage =
      totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    // Calculate average ease factor and interval for review cards
    const reviewCardsData = cards.filter((c) => c.status === 'review');
    const averageEaseFactor =
      reviewCardsData.length > 0
        ? reviewCardsData.reduce((sum, c) => sum + c.easeFactor, 0) /
          reviewCardsData.length
        : 0;

    const averageInterval =
      reviewCardsData.length > 0
        ? reviewCardsData.reduce((sum, c) => sum + c.interval, 0) /
          reviewCardsData.length
        : 0;

    // Get last studied date
    const lastReview =
      allReviews.length > 0
        ? allReviews.reduce((latest, current) =>
            current.reviewedAt > latest.reviewedAt ? current : latest,
          )
        : null;

    // Calculate consecutive days studied (reuse existing logic if available)
    // For now, we'll calculate a simple version
    const consecutiveDaysStudied = await this.getConsecutiveStudyDays(deckId);

    // Calculate average reviews per day (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviews = allReviews.filter(
      (r) => r.reviewedAt >= thirtyDaysAgo,
    );
    const averageReviewsPerDay = recentReviews.length / 30;

    // Estimated review time (assuming 10 seconds per card)
    const estimatedReviewTime = Math.ceil((cardsDueToday * 10) / 60);

    // Completion percentage (cards that have been reviewed at least once)
    const reviewedCards = cards.filter((c) => c.reviews.length > 0).length;
    const completionPercentage =
      totalCards > 0 ? (reviewedCards / totalCards) * 100 : 0;

    // Maturity percentage
    const maturityPercentage =
      totalCards > 0 ? (matureCards / totalCards) * 100 : 0;

    return {
      totalCards,
      newCards,
      learningCards,
      reviewCards,
      relearningCards,
      matureCards,
      youngCards,
      cardsDueToday,
      cardsDueNextWeek,
      retentionRate: parseFloat(correctPercentage.toFixed(2)),
      averageEaseFactor: parseFloat(averageEaseFactor.toFixed(2)),
      averageInterval: parseFloat(averageInterval.toFixed(2)),
      totalReviews,
      correctPercentage: parseFloat(correctPercentage.toFixed(2)),
      lastStudiedDate: lastReview ? lastReview.reviewedAt : null,
      consecutiveDaysStudied,
      cardDistribution: {
        new: newCards,
        learning: learningCards,
        review: reviewCards,
        relearning: relearningCards,
      },
      qualityDistribution: {
        Again: againCount,
        Hard: hardCount,
        Good: goodCount,
        Easy: easyCount,
      },
      averageReviewsPerDay: parseFloat(averageReviewsPerDay.toFixed(2)),
      estimatedReviewTime,
      completionPercentage: parseFloat(completionPercentage.toFixed(2)),
      maturityPercentage: parseFloat(maturityPercentage.toFixed(2)),
    };
  }

  private async getConsecutiveStudyDays(deckId: number): Promise<number> {
    const reviews = await this.prisma.cardReview.findMany({
      where: {
        card: {
          deckId,
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
      select: {
        reviewedAt: true,
      },
    });

    if (reviews.length === 0) return 0;

    // Group reviews by date
    const uniqueDates = new Set(
      reviews.map((r) => r.reviewedAt.toISOString().split('T')[0]),
    );

    const sortedDates = Array.from(uniqueDates).sort().reverse();

    let consecutiveDays = 0;
    const today = new Date().toISOString().split('T')[0];

    // Check if studied today or yesterday
    if (sortedDates[0] === today) {
      consecutiveDays = 1;
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (sortedDates[0] === yesterdayStr) {
        consecutiveDays = 1;
      } else {
        return 0; // Streak broken
      }
    }

    // Count consecutive days backward
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const previousDate = new Date(sortedDates[i - 1]);
      const diffDays = Math.floor(
        (previousDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        consecutiveDays++;
      } else {
        break;
      }
    }

    return consecutiveDays;
  }
}
