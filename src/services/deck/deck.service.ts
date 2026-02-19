import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDeckDto } from 'src/utils/types/dto/deck/createDeck.dto';

@Injectable()
export class DeckService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDeckDto) {
    return await this.prisma.deck.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId.id,
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
