import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CardStatisticsDto } from 'src/utils/types/dto/card/cardStatistics.dto';

interface ExampleSentence {
  sentence: string;
  translation: string;
}

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    deckId: number;
    front: string;
    back: string;
    tags?: string;
    wordType?: string;
    pronunciation?: string;
    examples?: ExampleSentence[];
  }) {
    // Fetch the deck to check language mode
    const deck = await this.prisma.deck.findUnique({
      where: { id: data.deckId },
    });

    if (!deck) {
      throw new Error('Deck not found');
    }

    // Convert examples array to JSON string if provided
    const examplesJson = data.examples
      ? JSON.stringify(data.examples)
      : undefined;

    // Create the primary card
    const primaryCard = await this.prisma.card.create({
      data: {
        deckId: data.deckId,
        front: data.front,
        back: data.back,
        tags: data.tags,
        wordType: data.wordType,
        pronunciation: data.pronunciation,
        examples: examplesJson,
      },
    });

    // If deck is BIDIRECTIONAL, create reverse card automatically
    if (deck.languageMode === 'BIDIRECTIONAL') {
      // Create reverse card with swapped front and back
      // Now duplicate rich content fields on the reverse card as requested
      await this.prisma.card.create({
        data: {
          deckId: data.deckId,
          front: data.back, // Swap: English word becomes front
          back: data.front, // Vietnamese word becomes back
          tags: data.tags,
          wordType: data.wordType,
          pronunciation: data.pronunciation,
          examples: examplesJson,
        },
      });
    }

    // Parse examples back to object for response
    return {
      ...primaryCard,
      examples: primaryCard.examples ? JSON.parse(primaryCard.examples) : null,
    };
  }

  async findAll() {
    const cards = await this.prisma.card.findMany({
      include: {
        deck: true,
        reviews: true,
      },
    });

    // Parse examples JSON string to object for each card
    return cards.map((card) => ({
      ...card,
      examples: card.examples ? JSON.parse(card.examples) : null,
    }));
  }

  async findOne(id: number) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        deck: {
          include: {
            user: true,
          },
        },
        reviews: {
          orderBy: {
            reviewedAt: 'desc',
          },
        },
      },
    });

    if (!card) {
      return null;
    }

    // Parse examples JSON string to object
    return {
      ...card,
      examples: card.examples ? JSON.parse(card.examples) : null,
    };
  }

  async findByDeck(deckId: number) {
    const cards = await this.prisma.card.findMany({
      where: { deckId },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // Parse examples JSON string to object for each card
    return cards.map((card) => ({
      ...card,
      examples: card.examples ? JSON.parse(card.examples) : null,
    }));
  }

  async update(
    id: number,
    data: {
      front?: string;
      back?: string;
      tags?: string;
      wordType?: string;
      pronunciation?: string;
      examples?: ExampleSentence[];
    },
  ) {
    // Convert examples array to JSON string if provided
    const examplesJson = data.examples
      ? JSON.stringify(data.examples)
      : undefined;

    const updatedCard = await this.prisma.card.update({
      where: { id },
      data: {
        ...data,
        examples: examplesJson,
      },
    });

    // Parse examples back to object for response
    return {
      ...updatedCard,
      examples: updatedCard.examples ? JSON.parse(updatedCard.examples) : null,
    };
  }

  async remove(id: number) {
    return await this.prisma.card.delete({
      where: { id },
    });
  }

  async getReviewStatus(id: number) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const latestReview = card.reviews[0];

    return {
      cardId: card.id,
      lastReviewedAt: latestReview ? latestReview.reviewedAt : null,
      nextReviewDate: latestReview ? latestReview.nextReviewDate : null,
      hasBeenReviewed: !!latestReview,
    };
  }

  async getCardStatistics(cardId: number): Promise<CardStatisticsDto> {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'asc',
          },
        },
      },
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const reviews = card.reviews;
    const totalReviews = reviews.length;

    // Count reviews by quality
    const againCount = reviews.filter((r) => r.quality === 'Again').length;
    const hardCount = reviews.filter((r) => r.quality === 'Hard').length;
    const goodCount = reviews.filter((r) => r.quality === 'Good').length;
    const easyCount = reviews.filter((r) => r.quality === 'Easy').length;

    // Correct reviews are Good and Easy
    const correctReviews = goodCount + easyCount;
    const correctPercentage =
      totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    // Average time per review is not available in current schema
    // const averageTimePerReview = null;

    // Calculate card age
    const cardAge = Math.floor(
      (Date.now() - card.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get last review date
    const lastReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;

    // Calculate retention rate (correct answers / total reviews)
    const retentionRate = correctPercentage;

    return {
      totalReviews,
      correctReviews,
      correctPercentage: parseFloat(correctPercentage.toFixed(2)),
      againCount,
      hardCount,
      goodCount,
      easyCount,
      currentInterval: card.interval,
      easeFactor: card.easeFactor,
      nextReviewDate: card.nextReviewDate!,
      lastReviewDate: lastReview ? lastReview.reviewedAt : null,
      status: card.status,
      averageTimePerReview: null,
      cardAge,
      retentionRate: parseFloat(retentionRate.toFixed(2)),
    };
  }

  async getCardsStatisticsByDeck(deckId: number): Promise<CardStatisticsDto[]> {
    const cards = await this.prisma.card.findMany({
      where: { deckId },
      include: {
        reviews: {
          orderBy: {
            reviewedAt: 'asc',
          },
        },
      },
    });

    return Promise.all(cards.map((card) => this.getCardStatistics(card.id)));
  }
}
