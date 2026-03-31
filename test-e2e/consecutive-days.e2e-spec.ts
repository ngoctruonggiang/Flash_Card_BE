import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { CardStatus } from '@prisma/client';
import { ReviewService } from '../src/services/review/review.service';
import { createTestUser } from './create-test-user';

describe('Study Consecutive Days (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let reviewService: ReviewService;
  let accessToken: string;
  let userId: number;
  let testDeck: any;
  let testCards: any[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    reviewService = moduleFixture.get<ReviewService>(ReviewService);

    const testUser = {
      username: 'consecutivedaysuser',
      email: 'consecutivedays@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const authResponse = await createTestUser(moduleFixture, testUser);
    accessToken = authResponse.accessToken;
    userId = authResponse.id;

    // Create a test deck
    testDeck = await prismaService.deck.create({
      data: {
        userId: userId,
        title: 'Consecutive Days Test Deck',
        description: 'Deck for testing consecutive study days',
      },
    });

    // Create test cards
    testCards = [];
    for (let i = 0; i < 3; i++) {
      const card = await prismaService.card.create({
        data: {
          deckId: testDeck.id,
          front: `Test Question ${i + 1}`,
          back: `Test Answer ${i + 1}`,
        },
      });
      testCards.push(card);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (testCards && testCards.length > 0) {
      for (const card of testCards) {
        await reviewService.removeByCardId(card.id);
        await prismaService.card.delete({ where: { id: card.id } });
      }
    }
    if (testDeck) {
      await prismaService.deck.delete({ where: { id: testDeck.id } });
    }
    await prismaService.user.delete({ where: { id: userId } });
    await app.close();
  });

  describe('/study/consecutive-days/:id (GET)', () => {
    it('should return 0 consecutive days for a deck with no reviews', async () => {
      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toEqual({
        consecutiveDays: 0,
        streakStartDate: null,
        lastStudyDate: null,
      });
    });

    it('should return 1 consecutive day after studying today', async () => {
      const today = new Date();

      // Create a review for today
      await prismaService.cardReview.create({
        data: {
          cardId: testCards[0].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: today,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.consecutiveDays).toBe(1);
      expect(response.body.data.lastStudyDate).toBeDefined();
      expect(response.body.data.streakStartDate).toBeDefined();
    });

    it('should return 3 consecutive days when studied for 3 consecutive days', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Create reviews for 3 consecutive days
      for (let i = 0; i < 3; i++) {
        const reviewDate = new Date(today);
        reviewDate.setDate(today.getDate() - i);

        await prismaService.cardReview.create({
          data: {
            cardId: testCards[i % testCards.length].id,
            repetitions: 1,
            interval: 1,
            eFactor: 2.5,
            quality: 'Good',
            previousStatus: CardStatus.new,
            newStatus: CardStatus.learning,
            nextReviewDate: new Date(
              reviewDate.getTime() + 24 * 60 * 60 * 1000,
            ),
            reviewedAt: reviewDate,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.consecutiveDays).toBe(3);
      expect(response.body.data.lastStudyDate).toBeDefined();
      expect(response.body.data.streakStartDate).toBeDefined();
    });

    it('should break streak if more than 1 day passes without studying', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Last study was 3 days ago (more than 1 day gap)
      const lastStudyDate = new Date(today);
      lastStudyDate.setDate(today.getDate() - 3);

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[0].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(
            lastStudyDate.getTime() + 24 * 60 * 60 * 1000,
          ),
          reviewedAt: lastStudyDate,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.consecutiveDays).toBe(0);
      expect(response.body.data.lastStudyDate).toBeDefined();
      expect(response.body.data.streakStartDate).toBeNull();
    });

    it('should count yesterday as part of active streak', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Study yesterday and the day before
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(today.getDate() - 2);

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[0].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: yesterday,
        },
      });

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[1].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(twoDaysAgo.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: twoDaysAgo,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.consecutiveDays).toBe(2);
      expect(response.body.data.lastStudyDate).toBeDefined();
      expect(response.body.data.streakStartDate).toBeDefined();
    });

    it('should handle multiple reviews on the same day correctly', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Create multiple reviews for today on different cards
      for (let i = 0; i < testCards.length; i++) {
        await prismaService.cardReview.create({
          data: {
            cardId: testCards[i].id,
            repetitions: 1,
            interval: 1,
            eFactor: 2.5,
            quality: 'Good',
            previousStatus: CardStatus.new,
            newStatus: CardStatus.learning,
            nextReviewDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            reviewedAt: new Date(today.getTime() + i * 60 * 60 * 1000), // Different times same day
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should count as 1 day even with multiple reviews
      expect(response.body.data.consecutiveDays).toBe(1);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(401);
    });

    it('should return proper response structure', async () => {
      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('path');

      expect(response.body.data).toHaveProperty('consecutiveDays');
      expect(response.body.data).toHaveProperty('streakStartDate');
      expect(response.body.data).toHaveProperty('lastStudyDate');
    });

    it('should handle a 7-day streak correctly', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Create reviews for 7 consecutive days
      for (let i = 0; i < 7; i++) {
        const reviewDate = new Date(today);
        reviewDate.setDate(today.getDate() - i);

        await prismaService.cardReview.create({
          data: {
            cardId: testCards[i % testCards.length].id,
            repetitions: i + 1,
            interval: i + 1,
            eFactor: 2.5,
            quality: 'Good',
            previousStatus: CardStatus.new,
            newStatus: CardStatus.learning,
            nextReviewDate: new Date(
              reviewDate.getTime() + 24 * 60 * 60 * 1000,
            ),
            reviewedAt: reviewDate,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.consecutiveDays).toBe(7);

      // Verify streak start is 7 days ago
      const streakStart = new Date(response.body.data.streakStartDate);
      const expectedStreakStart = new Date(today);
      expectedStreakStart.setDate(today.getDate() - 6);

      expect(streakStart.getUTCDate()).toBe(expectedStreakStart.getUTCDate());
    });

    it('should handle gap in study days correctly', async () => {
      // Clean up previous reviews
      await prismaService.cardReview.deleteMany({
        where: { cardId: { in: testCards.map((c) => c.id) } },
      });

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Study today and yesterday
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      // Then a gap of 2 days, and study 4 days ago
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(today.getDate() - 4);

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[0].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: today,
        },
      });

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[1].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: yesterday,
        },
      });

      await prismaService.cardReview.create({
        data: {
          cardId: testCards[2].id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
          nextReviewDate: new Date(fourDaysAgo.getTime() + 24 * 60 * 60 * 1000),
          reviewedAt: fourDaysAgo,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should only count the current streak (today and yesterday)
      expect(response.body.data.consecutiveDays).toBe(2);
    });
  });
});
