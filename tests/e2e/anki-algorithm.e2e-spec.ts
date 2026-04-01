import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/services/prisma.service';
import { ReviewService } from 'src/services/review/review.service';
import { createTestUser } from './create-test-user';

describe('Anki Algorithm E2E Sequence', () => {
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
      username: 'ankitestuser',
      email: 'ankitest@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    const authResponse = await createTestUser(moduleFixture, testUser);
    accessToken = authResponse.accessToken;

    // 1. Create a new deck of cards
    testDeck = await prismaService.deck.create({
      data: {
        userId: authResponse.id,
        title: 'Anki Algorithm Test Deck',
        description: 'Deck for testing Anki algorithm sequence',
      },
    });

    // 2. Cards have all fields filled
    testCard = await prismaService.card.create({
      data: {
        deckId: testDeck.id,
        front: 'Test Front',
        back: 'Test Back',
        wordType: 'noun',
        pronunciation: '/test/',
        examples: JSON.stringify(['This is a test example.']),
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

  describe('3. Simulate a study session and check the preview', () => {
    it('Step 1: Initial State (New Card)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // New cards:
      // Again: 1 min (step 0)
      // Hard: 1 min (step 0)
      // Good: 10 min (step 1)
      // Easy: 4 days (graduate)
      expect(response.body.data.Again).toBe('1 min');
      expect(response.body.data.Hard).toBe('1 min');
      expect(response.body.data.Good).toBe('10 min');
      expect(response.body.data.Easy).toBe('4 days');
    });

    it('Step 2: First Review (Good) -> Learning Step 1', async () => {
      // User presses "Good"
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

      // Check preview
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Current: Learning, Step 1 (10 min)
      // Again: 1 min (Reset to step 0)
      // Hard: 10 min (Repeat step 1)
      // Good: 1 day (Graduate)
      // Easy: 4 days (Graduate with bonus)
      expect(response.body.data.Again).toBe('1 min');
      expect(response.body.data.Hard).toBe('10 min');
      expect(response.body.data.Good).toBe('1 day');
      expect(response.body.data.Easy).toBe('4 days');
    });

    it('Step 3: Second Review (Good) -> Graduate to Review', async () => {
      // User presses "Good" again
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

      // Check preview
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Current: Review, Interval 1 day, EF 2.5
      // Again: 10 min (Lapse to Relearning)
      // Hard: 1.2 days -> 1 day (1 * 1.2)
      // Good: 2.5 days -> 2 or 3 days (1 * 2.5)
      // Easy: 3.25 days -> 3 or 4 days (1 * 2.5 * 1.3)

      expect(response.body.data.Again).toBe('10 min');

      // Hard (1.2 days)
      expect(response.body.data.Hard).toMatch(/1 day|2 days/);

      // Good (2.5 days)
      expect(response.body.data.Good).toMatch(/2 days|3 days/);

      // Easy (3.25 days)
      expect(response.body.data.Easy).toMatch(/3 days|4 days/);
    });

    it('Step 4: Lapse (Again) -> Relearning', async () => {
      // User presses "Again"
      await request(app.getHttpServer())
        .post('/study/review')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          CardReviews: [
            {
              cardId: testCard.id,
              quality: 'Again',
            },
          ],
          reviewedAt: new Date().toISOString(),
        })
        .expect(201);

      // Check preview
      const response = await request(app.getHttpServer())
        .get(`/study/preview/${testCard.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Current: Relearning, Step 0 (10 min)
      // Again: 10 min (Reset step 0)
      // Good: 1 day (Graduate from relearning)
      expect(response.body.data.Again).toBe('10 min');
      expect(response.body.data.Good).toBe('1 day');
    });
  });
});
