import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from 'src/utils/types/dto/user/updateUser.dto';
import { bcryptConstants } from 'src/utils/constants';
import * as bcrypt from 'bcrypt';
import { UserDto } from 'src/utils/types/dto/user/user.dto';

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

  async getUserById(id: number): Promise<UserDto | null> {
    const user = await this.findOne(id);
    return user ? new UserDto(user) : null;
  }

  async getUserByUsername(username: string): Promise<UserDto | null> {
    const user = await this.findByUsername(username);
    return user ? new UserDto(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserDto | null> {
    const user = await this.findByEmail(email);
    return user ? new UserDto(user) : null;
  }

  async getAllUsers(): Promise<UserDto[]> {
    const users = await this.findAll();
    return users.map((user) => new UserDto(user));
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

  async update(id: number, data: UpdateUserDto): Promise<User> {
    let hashedPassword: string | undefined = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(
        data.password,
        bcryptConstants.saltOrRounds,
      );
    }
    return await this.prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role,
      },
    });
  }

  async markEmailAsConfirmed(id: number): Promise<User> {
    return await this.prisma.user.update({
      where: { id },
      data: { isEmailConfirmed: true },
    });
  }

  async remove(id: number): Promise<User> {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async removeByUsername(username: string): Promise<User> {
    return await this.prisma.user.delete({
      where: { username },
    });
  }
}
