import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DeckService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: number; title: string; description?: string }) {
    return await this.prisma.deck.create({
      data,
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
    return await this.prisma.deck.delete({
      where: { id },
    });
  }
}
