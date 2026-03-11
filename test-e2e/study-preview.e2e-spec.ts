import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/services/prisma.service';
import { ReviewService } from '../src/services/review/review.service';
import { createTestUser } from './create-test-user';

describe('Study Preview (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let reviewService: ReviewService;
  let accessToken: string;
  let testDeck: any;
  let testCard: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    reviewService = moduleFixture.get<ReviewService>(ReviewService);

    const testUser = {
      username: 'previewtestuser',
      email: 'previewtest@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const authResponse = await createTestUser(moduleFixture, testUser);
    accessToken = authResponse.accessToken;

    // Create a test deck
    testDeck = await prismaService.deck.create({
      data: {
        userId: authResponse.id,
        title: 'Preview Test Deck',
        description: 'Deck for testing preview functionality',
      },
    });

    // Create a test card
    testCard = await prismaService.card.create({
      data: {
        deckId: testDeck.id,
        front: 'Test Question',
        back: 'Test Answer',
      },
    });
  });

  afterAll(async () => {
    if (testCard) {
      await reviewService.removeByCardId(testCard.id);
      await prismaService.card.delete({ where: { id: testCard.id } });
    }
    if (testDeck) {
      await prismaService.deck.delete({ where: { id: testDeck.id } });
    }
    await app.close();
  });

  describe('/study/preview/:id (GET)', () => {
    it('should return preview intervals for a new card', async () => {
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('Again');
      expect(response.body.data).toHaveProperty('Hard');
      expect(response.body.data).toHaveProperty('Good');
      expect(response.body.data).toHaveProperty('Easy');

      // New cards now have differentiated intervals
      expect(response.body.data.Again).toBe('1 day');
      expect(response.body.data.Hard).toBe('1 day');
      expect(response.body.data.Good).toBe('3 days');
      expect(response.body.data.Easy).toBe('5 days');
    });

    it('should return different intervals after first review', async () => {
      // Submit first review as "Good"
      await request(app.getHttpServer())
        .post('/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          CardReviews: [
            {
              cardId: testCard.id,
              quality: 'Good',
            },
          ],
          reviewedAt: new Date().toISOString(),
        })
        .expect(201);

      // Check preview after first review
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.Again).toBe('1 day');
      expect(response.body.data.Hard).toBe('6 days');
      expect(response.body.data.Good).toBe('6 days');
      expect(response.body.data.Easy).toBe('6 days');
    });

    it('should return increasing intervals after second review', async () => {
      // Submit second review as "Good"
      await request(app.getHttpServer())
        .post('/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          CardReviews: [
            {
              cardId: testCard.id,
              quality: 'Good',
            },
          ],
          reviewedAt: new Date().toISOString(),
        })
        .expect(201);

      // Check preview after second review
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.Again).toBe('1 day');

      // After rep=2, all success options use prev_interval * eFactor
      const hardInterval = parseInt(response.body.data.Hard);
      const goodInterval = parseInt(response.body.data.Good);
      const easyInterval = parseInt(response.body.data.Easy);

      expect(hardInterval).toBeGreaterThanOrEqual(6);
      expect(goodInterval).toBeGreaterThanOrEqual(6);
      expect(easyInterval).toBeGreaterThanOrEqual(6);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .expect(401);
    });

    it('should handle non-existent card gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/study/preview/999999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Should return defaults for new card (no review found) - now differentiated
      expect(response.body.data.Again).toBe('1 day');
      expect(response.body.data.Hard).toBe('1 day');
      expect(response.body.data.Good).toBe('3 days');
      expect(response.body.data.Easy).toBe('5 days');
    });
  });

  describe('Preview consistency with actual review', () => {
    it('should match the actual interval after submitting a review', async () => {
      // Create a fresh card for this test
      const freshCard = await prismaService.card.create({
        data: {
          deckId: testDeck.id,
          front: 'Consistency Test Question',
          back: 'Consistency Test Answer',
        },
      });

      try {
        // Get preview
        const previewResponse = await request(app.getHttpServer())
          .get(`/study/preview/${freshCard.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const previewGoodInterval = previewResponse.body.data.Good;

        // Submit actual review as "Good"
        const reviewDate = new Date();
        const reviewResponse = await request(app.getHttpServer())
          .post('/study/review')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            CardReviews: [
              {
                cardId: freshCard.id,
                quality: 'Good',
              },
            ],
            reviewedAt: reviewDate.toISOString(),
          })
          .expect(201);

        const actualInterval = reviewResponse.body.data[0].interval;
        const actualIntervalText =
          actualInterval === 1 ? '1 day' : `${actualInterval} days`;

        // Preview should match actual
        expect(previewGoodInterval).toBe(actualIntervalText);
      } finally {
        await reviewService.removeByCardId(freshCard.id);
        await prismaService.card.delete({ where: { id: freshCard.id } });
      }
    });
  });
});
