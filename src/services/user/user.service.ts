import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    username: string;
    email: string;
    password: string;
    lastLoginAt: Date;
  }) {
    return await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash: data.password,
        lastLoginAt: data.lastLoginAt,
      },
    });
  }

  async findAll() {
    return await this.prisma.user.findMany({
      include: {
        decks: true,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: {
        decks: {
          include: {
            cards: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        decks: {
          include: {
            cards: true,
          },
        },
      },
    });
  }

  async update(
    id: number,
    data: {
      username?: string;
      email?: string;
      passwordHash?: string;
      lastLoginAt?: Date;
    },
  ) {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
