/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { CardService } from 'src/services/card/card.service';
import { Card, Deck } from '@prisma/client';
import { DeckService } from 'src/services/deck/deck.service';
import { createTestUser } from './create-test-user';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;

  const testUserSignUp: SignUpDto = {
    username: 'e2ecarduser',
    email: 'e2ecarduser@example.com',
    password: 'e2ecarduserpassword',
    confirmPassword: 'e2ecarduserpassword',
  };
  let testDeck: Deck;
  let testCards: Card[];
  let testUser: AuthResponseDto;

  const authRequest = () => {
    const server = app.getHttpServer();
    return {
      get: (url: string) =>
        request(server)
          .get(url)
          .set('Authorization', `Bearer ${testUser?.accessToken}`),
      post: (url: string) =>
        request(server)
          .post(url)
          .set('Authorization', `Bearer ${testUser?.accessToken}`),
      patch: (url: string) =>
        request(server)
          .patch(url)
          .set('Authorization', `Bearer ${testUser?.accessToken}`),
      delete: (url: string) =>
        request(server)
          .delete(url)
          .set('Authorization', `Bearer ${testUser?.accessToken}`),
    };
  };

  beforeAll(async () => {
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

    testUser = await createTestUser(moduleFixture, testUserSignUp);
  });

  beforeEach(async () => {
    testDeck = await deckService.create(testUser.id, {
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
    if (testCards) {
      for (const card of testCards) {
        await cardService.remove(card.id);
      }
    }
    if (testDeck) {
      await deckService.remove(testDeck.id);
    }
  });

  afterAll(async () => {
    await userService.remove(testUser.id);
    await app.close();
  });

  it('/card (POST) Create Card', async () => {
    const res = await authRequest()
      .post('/card')
      .send({
        deckId: testDeck.id,
        front: 'Front Test',
        back: 'Back Test',
      })
      .expect(HttpStatus.CREATED);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.front).toBe('Front Test');
    expect(res.body.data.back).toBe('Back Test');
    expect(res.body.data.deckId).toBe(testDeck.id);

    await cardService.remove(res.body.data.id);
  });

  it('/card?deckId= (Get) Get all card in deck', async () => {
    const res = await authRequest()
      .get(`/card?deckId=${testDeck.id}`)
      .expect(HttpStatus.OK);

    expect(res.body).toBeDefined();

    expect(res.body).toBeInstanceOf(Object);
    expect(res.body.data.length).toBe(3);
    const cardIds = res.body.data.map((c: Card) => c.id).sort();
    const expectedIds = testCards.map((c) => c.id).sort();
    expect(cardIds).toEqual(expectedIds);
  });

  it('/card/id (Patch) update card', async () => {
    const res = await authRequest()
      .patch(`/card/${testCards[0].id}`)
      .send({
        front: 'Updated Front',
        back: 'Updated Back',
        tags: 'updated,tag',
      })
      .expect(HttpStatus.OK);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testCards[0].id);
    expect(res.body.data.front).toBe('Updated Front');
    expect(res.body.data.back).toBe('Updated Back');
    expect(res.body.data.tags).toBe('updated,tag');
  });

  it('/card/id (Delete) Delete card', async () => {
    const res = await authRequest()
      .delete(`/card/${testCards[0].id}`)
      .expect(HttpStatus.OK);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testCards[0].id);

    // Verify deletion
    const deletedCard = await cardService.findOne(testCards[0].id);
    expect(deletedCard).toBeNull();

    testCards = testCards.filter((card) => card.id !== testCards[0].id);
  });
});
