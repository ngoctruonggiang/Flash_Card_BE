import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { CardService } from 'src/services/card/card.service';
import { Deck } from '@prisma/client';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;

  const testUser = {
    username: 'e2euser',
    email: 'e2euser@example.com',
    password: 'e2euserpassword',
  };
  let testDeck: Deck;
  let jwtToken: JwtTokenReturn | null = null;

  // beforeEach(async () => {
  //   const moduleFixture: TestingModule = await Test.createTestingModule({
  //     imports: [AppModule],
  //   }).compile();

  //   app = moduleFixture.createNestApplication();
  //   await app.init();

  //   userService = moduleFixture.get<UserService>(UserService);
  //   cardService = moduleFixture.get<CardService>(CardService);

  //   const authService = moduleFixture.get<AuthService>(AuthService);
  //   const existingUser = await userService.findByEmail(testUser.email);
  //   if (!existingUser) {
  //     jwtToken = await authService.signUp(testUser);
  //   } else {
  //     jwtToken = await authService.signIn({
  //       username: testUser.username,
  //       password: testUser.password,
  //     });
  //   }
  // });

  // afterAll(async () => {
  //   const user = await userService.findByEmail(testUser.email);
  //   if (user) {
  //     await userService.remove(user.id);
  //   }

  //   await app.close();
  // });

  it('/card (GET)', async () => {});
});
