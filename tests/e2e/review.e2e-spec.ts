/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { Card, Deck } from '@prisma/client';
import { ReviewQuality } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { ReviewService } from 'src/services/review/review.service';
import { SubmitReviewDto } from 'src/utils/types/dto/review/submitReview.dto';

describe('ReviewController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;
  let cardService: CardService;
  let authService: AuthService;
  let reviewService: ReviewService;

  const testUserSignUpDTO: SignUpDto = {
    username: 'reviewtestuser',
    email: 'reviewtestuser@example.com',
    password: 'reviewpassword123',
    confirmPassword: 'reviewpassword123',
  };

  let testUser: AuthResponseDto;
  let testDeck: Deck;
  let testCards: Card[];

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
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    deckService = moduleFixture.get<DeckService>(DeckService);
    cardService = moduleFixture.get<CardService>(CardService);
    authService = moduleFixture.get<AuthService>(AuthService);
    reviewService = moduleFixture.get<ReviewService>(ReviewService);

    testUser = await authService.signUp(testUserSignUpDTO);
  });

  beforeEach(async () => {
    // Create Deck
    testDeck = await deckService.create(testUser.id, {
      title: 'Review Test Deck',
      description: 'Deck for testing reviews',
    });

    // Create Cards
    testCards = [];
    for (let i = 0; i < 3; i++) {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: `Front ${i}`,
        back: `Back ${i}`,
      });
      testCards.push(card);
    }
  });

  afterEach(async () => {
    // Cleanup Cards and Deck
    if (testCards) {
      for (const card of testCards) {
        await reviewService.removeByCardId(card.id);
        await cardService.remove(card.id);
      }
    }
    if (testDeck) {
      await deckService.remove(testDeck.id);
    }
  });

  afterAll(async () => {
    // Cleanup User
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('/study/start/:id (GET)', () => {
    it('should return all cards as due when no reviews exist', async () => {
      const res = await authRequest()
        .get(`/study/start/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.data.length).toBe(3);
      const body = res.body.data as Card[];
      expect(body.map((c) => c.id).sort()).toEqual(
        testCards.map((c) => c.id).sort(),
      );
    });
  });

  describe('/study/review (POST)', () => {
    it('should submit a review and update card schedule', async () => {
      const cardToReview = testCards[0];
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Tomorrow

      const reviewPayload: SubmitReviewDto = {
        CardReviews: [
          {
            cardId: cardToReview.id,
            quality: ReviewQuality.Good,
          },
        ],
        reviewedAt: new Date(),
      };

      // Submit Review
      await authRequest()
        .post('/study/review')
        .send(reviewPayload)
        .expect(HttpStatus.CREATED);

      // Check Due Reviews - cardToReview should NOT be present (next review is tomorrow)
      const res = await authRequest()
        .get(`/study/start/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeInstanceOf(Object);
      expect(res.body.data.length).toBe(2); // 3 - 1 = 2
      const body = res.body.data as Card[];
      const returnedIds = body.map((c) => c.id);
      expect(returnedIds).not.toContain(cardToReview.id);
    });
  });

  describe('/study/cram/:deckId (GET)', () => {
    it('should start a cram session and return cards', async () => {
      const res = await authRequest()
        .get(`/study/cram/${testDeck.id}?limit=10`)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.message).toBe('Start Cram Session');
      expect(res.body.data.data).toBeInstanceOf(Array);
      // We created 3 cards, so we expect 3 cards in cram session
      expect(res.body.data.data.length).toBe(3);
      expect(res.body.data.total).toBe(3);
    });
  });
});
