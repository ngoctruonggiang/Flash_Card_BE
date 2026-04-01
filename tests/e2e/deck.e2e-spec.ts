/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { Deck, CardStatus } from '@prisma/client';
import { DeckService } from 'src/services/deck/deck.service';
import { PrismaService } from 'src/services/prisma.service';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;
  let prismaService: PrismaService;

  const userSignUpDto: SignUpDto = {
    username: 'e2edeckuser',
    email: 'e2edeckuser@example.com',
    password: 'e2euserpassword',
    confirmPassword: 'e2euserpassword',
  };
  let testDeck: Deck | null;
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

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Automatically transform incoming data to DTO instances
        whitelist: true, // Remove properties not defined in the DTO
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      }),
    );
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    deckService = moduleFixture.get<DeckService>(DeckService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    testUser = await createTestUser(moduleFixture, userSignUpDto);
  });

  beforeEach(async () => {
    testDeck = await deckService.create(testUser.id, {
      title: 'Test Deck',
      description: 'This is a test deck',
    });
  });

  afterEach(async () => {
    if (testDeck) {
      await deckService.remove(testDeck.id);
    }
  });

  afterAll(async () => {
    await userService.remove(testUser.id);

    await app.close();
  });

  it('/deck (POST) create Deck', async () => {
    const res = await authRequest()
      .post('/deck')
      .send({
        title: 'Test Deck',
        description: 'This is a test deck',
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.title).toBe('Test Deck');
    expect(res.body.data.description).toBe('This is a test deck');
    expect(res.body.data.userId).toBe(testUser.id);

    // Clean up - delete the created deck
    const createdDeckId = res.body.data.id as number;
    await deckService.remove(createdDeckId);
  });

  it('/deck/:id (GET) ', async () => {
    const res = await authRequest().get(`/deck/${testDeck?.id}`).expect(200);

    // Clean up - delete the created deck
    const getDeck = res.body.data;
    expect(getDeck.id).toBe(testDeck?.id);
    expect(getDeck.title).toBe(testDeck?.title);
    expect(getDeck.description).toBe(testDeck?.description);
  });

  it('/deck/:id (PATCH) ', async () => {
    const res = await authRequest()
      .patch(`/deck/${testDeck?.id}`)
      .send({
        title: 'Updated Test Deck',
      })
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testDeck?.id);
    expect(res.body.data.title).toBe('Updated Test Deck');
    // Description should remain unchanged
    expect(res.body.data.description).toBe(testDeck?.description);
  });

  it('/deck/:id (DELETE) ', async () => {
    const res = await authRequest().delete(`/deck/${testDeck?.id}`).expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(testDeck?.id);

    // Verify deletion
    const deletedDeck = await deckService.findOne(testDeck!.id);
    expect(deletedDeck).toBeNull();

    testDeck = null;
  });

  it('/deck/:id (DELETE) with cards and reviews - cascade delete', async () => {
    // Create a deck with cards and reviews
    const deckWithCards = await deckService.create(testUser.id, {
      title: 'Deck with Cards',
      description: 'Deck to test cascade deletion',
    });

    // Create cards in the deck
    const card1 = await prismaService.card.create({
      data: {
        deckId: deckWithCards.id,
        front: 'Front 1',
        back: 'Back 1',
      },
    });

    const card2 = await prismaService.card.create({
      data: {
        deckId: deckWithCards.id,
        front: 'Front 2',
        back: 'Back 2',
      },
    });

    // Create reviews for the cards
    await prismaService.cardReview.create({
      data: {
        cardId: card1.id,
        repetitions: 1,
        interval: 1,
        eFactor: 2.5,
        nextReviewDate: new Date(),
        reviewedAt: new Date(),
        quality: 'Good',
        previousStatus: CardStatus.new,
        newStatus: CardStatus.learning,
      },
    });

    await prismaService.cardReview.create({
      data: {
        cardId: card2.id,
        repetitions: 1,
        interval: 1,
        eFactor: 2.5,
        nextReviewDate: new Date(),
        reviewedAt: new Date(),
        quality: 'Easy',
        previousStatus: CardStatus.learning,
        newStatus: CardStatus.review,
      },
    });

    // Verify deck, cards, and reviews exist before deletion
    const deckBefore = await deckService.findOne(deckWithCards.id);
    expect(deckBefore).not.toBeNull();
    expect(deckBefore?.cards).toHaveLength(2);

    const reviewsBefore = await prismaService.cardReview.findMany({
      where: {
        cardId: {
          in: [card1.id, card2.id],
        },
      },
    });
    expect(reviewsBefore).toHaveLength(2);

    // Delete the deck
    const res = await authRequest()
      .delete(`/deck/${deckWithCards.id}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe(deckWithCards.id);

    // Verify deck is deleted
    const deletedDeck = await deckService.findOne(deckWithCards.id);
    expect(deletedDeck).toBeNull();

    // Verify cards are deleted
    const cardsAfter = await prismaService.card.findMany({
      where: {
        deckId: deckWithCards.id,
      },
    });
    expect(cardsAfter).toHaveLength(0);

    // Verify reviews are deleted
    const reviewsAfter = await prismaService.cardReview.findMany({
      where: {
        cardId: {
          in: [card1.id, card2.id],
        },
      },
    });
    expect(reviewsAfter).toHaveLength(0);
  });

  it('/deck (GET) Get all decks for current user', async () => {
    const res = await authRequest().get('/deck').expect(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    const deckIds = res.body.data.map((d: Deck) => d.id);
    expect(deckIds).toContain(testDeck?.id);
  });

  it('/deck/:id/reviewed-count-day (GET)', async () => {
    const res = await authRequest()
      .get(`/deck/${testDeck?.id}/reviewed-count-day`)
      .expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data).toHaveProperty('reviewedCount');
    expect(typeof res.body.data.reviewedCount).toBe('number');
  });

  it('/deck/:id/statistics (GET)', async () => {
    const res = await authRequest()
      .get(`/deck/${testDeck?.id}/statistics`)
      .expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data).toHaveProperty('totalReviews');
    expect(res.body.data).toHaveProperty('correctReviews');
    expect(res.body.data).toHaveProperty('correctPercentage');
    expect(res.body.data).toHaveProperty('againCount');
    expect(res.body.data).toHaveProperty('hardCount');
    expect(res.body.data).toHaveProperty('goodCount');
    expect(res.body.data).toHaveProperty('easyCount');
  });

  it('/deck/:id/last-studied (GET)', async () => {
    const res = await authRequest()
      .get(`/deck/${testDeck?.id}/last-studied`)
      .expect(200);
    expect(res.body.data).toBeDefined();
    // It might be null if never studied, or a date string
  });

  it('/deck/:id/due-today (GET)', async () => {
    const res = await authRequest()
      .get(`/deck/${testDeck?.id}/due-today`)
      .expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data).toBeInstanceOf(Array);
  });
});
