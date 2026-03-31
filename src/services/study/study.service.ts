import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Card } from '@prisma/client';

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
}
