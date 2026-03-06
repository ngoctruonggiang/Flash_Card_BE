import { Injectable } from '@nestjs/common';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';
import { applySm2 } from './sm2Algo';
import { Card, CardReview } from '@prisma/client';
import { PrismaService } from '../prisma.service';

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
}
