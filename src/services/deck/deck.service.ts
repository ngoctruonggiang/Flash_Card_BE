import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';
import { DeckStatisticsDto } from 'src/utils/types/dto/deck/deckStatistics.dto';
import { ReviewQuality } from '@prisma/client';

@Injectable()
export class DeckService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, data: CreateDeckDto) {
    return await this.prisma.deck.create({
      data: {
        title: data.title,
        description: data.description,
        userId: userId,
      },
    });
  }

  async findAll() {
    return await this.prisma.deck.findMany({
      include: {
        user: true,
        cards: true,
      },
    });
  }

  async findOne(id: number) {
    try {
      return await this.prisma.deck.findUnique({
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
    } catch (error) {
      console.error('Error finding deck:', error);
      throw error;
    }
  }

  async findByUser(userId: number) {
    return await this.prisma.deck.findMany({
      where: { userId },
      include: {
        cards: true,
      },
    });
  }

  async update(
    id: number,
    data: {
      title?: string;
      description?: string;
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
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Get all cards in the deck with their latest review
    const cards = await this.prisma.card.findMany({
      where: {
        deckId,
        OR: [
          // Cards that have reviews due today or earlier
          {
            reviews: {
              some: {
                nextReviewDate: { lte: today },
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
    return sortedCards.map((card) => {
      const { reviews, ...cardData } = card;
      return {
        ...cardData,
        nextReviewDate: reviews[0]?.nextReviewDate || null,
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
}
