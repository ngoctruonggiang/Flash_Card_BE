import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
    lastLoginAt: Date;
  }): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany({
      include: {
        decks: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findOne(id: number): Promise<User | null> {
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
  ): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}
