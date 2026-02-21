/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { CardService } from 'src/services/card/card.service';
import { Card, Deck } from '@prisma/client';
import { DeckService } from 'src/services/deck/deck.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;

  const testUser = {
    username: 'e2ecarduser',
    email: 'e2ecarduser@example.com',
    password: 'e2ecarduserpassword',
  };
  let testDeck: Deck;
  let testCards: Card[];
  let testUserId: number;
  let jwtToken: JwtTokenReturn | null = null;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({
      logger: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Automatically transform incoming data to DTO instances
        whitelist: true, // Remove properties not defined in the DTO
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      }),
    );
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    cardService = moduleFixture.get<CardService>(CardService);
    deckService = moduleFixture.get<DeckService>(DeckService);

    const authService = moduleFixture.get<AuthService>(AuthService);
    const existingUser = await userService.findByEmail(testUser.email);
    if (!existingUser) {
      jwtToken = await authService.signUp(testUser);
    } else {
      jwtToken = await authService.signIn({
        username: testUser.username,
        password: testUser.password,
      });
    }
    testUserId = (await userService.findByEmail(testUser.email))!.id;

    testDeck = await deckService.create(testUserId, {
      title: 'Card Test Deck',
      description: 'This is a test deck',
    });

    testCards = [];
    for (let i = 0; i < 3; i++) {
      testCards.push(
        await cardService.create({
          deckId: testDeck.id,
          front: `Card ${i + 1} Front`,
          back: `Card ${i + 1} Back`,
        }),
      );
    }
  });

  afterEach(async () => {
    for (const card of testCards) {
      await cardService.remove(card.id);
    }
    await deckService.remove(testDeck.id);
  });

  afterAll(async () => {
    const user = await userService.findByEmail(testUser.email);
    if (user) {
      await userService.remove(user.id);
    }
    await app.close();
  });

  it('/card (POST) Create Card', async () => {
    const res = await request(app.getHttpServer())
      .post('/card')
      .send({
        deckId: testDeck.id,
        front: 'Front Test',
        back: 'Back Test',
      })
      .expect(HttpStatus.CREATED);
    await cardService.remove(res.body.data.id);
  });

  it('/card?deckId= (Get) Get all card in deck', async () => {
    await request(app.getHttpServer())
      .get(`/card?deckId=${testDeck.id}`)
      .expect(HttpStatus.OK);
    // await cardService.remove(res.body.data.id);
  });

  it('/card/id (Patch) update card', async () => {
    await request(app.getHttpServer())
      .patch(`/card/${testCards[0].id}`)
      .send({
        front: 'Updated Front',
        back: 'Updated Back',
        tags: 'updated,tag',
      })
      .expect(HttpStatus.OK);
    // await cardService.remove(res.body.data.id);
  });

  it('/card/id (Delete) Delete card', async () => {
    await request(app.getHttpServer())
      .delete(`/card/${testCards[0].id}`)
      .expect(HttpStatus.OK);
    testCards = testCards.filter((card) => card.id !== testCards[0].id);
  });
});
