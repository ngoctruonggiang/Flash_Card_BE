import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
      // Note: Rich fields (wordType, pronunciation, examples) are only on the primary card
      // The reverse card has plain text only
      await this.prisma.card.create({
        data: {
          deckId: data.deckId,
          front: data.back, // Swap: English word becomes front
          back: data.front, // Vietnamese word becomes back
          tags: data.tags,
          // Don't include rich fields on reverse card to avoid giving away the answer
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
}
