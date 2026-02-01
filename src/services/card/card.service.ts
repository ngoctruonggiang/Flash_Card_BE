import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CardService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    deckId: number;
    front: string;
    back: string;
    tags?: string;
  }) {
    return await this.prisma.card.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.card.findMany({
      include: {
        deck: true,
        reviews: true,
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.card.findUnique({
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
  }

  async findByDeck(deckId: number) {
    return await this.prisma.card.findMany({
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
  }

  async update(
    id: number,
    data: {
      front?: string;
      back?: string;
      tags?: string;
    },
  ) {
    return await this.prisma.card.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return await this.prisma.card.delete({
      where: { id },
    });
  }
}
