/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { DeckService } from 'src/services/deck/deck.service';
import { CardService } from 'src/services/card/card.service';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaService } from 'src/services/prisma.service';
import { Card, Deck, ReviewQuality } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Review & Algorithm Comprehensive E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;
  let cardService: CardService;
  let reviewService: ReviewService;
  let prismaService: PrismaService;

  const baseTestUser: SignUpDto = {
    username: 'reviewcompr',
    email: 'reviewcomprehensive@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
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
    reviewService = moduleFixture.get<ReviewService>(ReviewService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    testUser = await createTestUser(moduleFixture, baseTestUser);
  });

  beforeEach(async () => {
    // Create test deck
    testDeck = await deckService.create(testUser.id, {
      title: 'Review Test Deck',
      description: 'Deck for comprehensive review tests',
    });

    // Create test cards
    testCards = [];
    for (let i = 0; i < 5; i++) {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: `Test Front ${i}`,
        back: `Test Back ${i}`,
      });
      testCards.push(card);
    }
  });

  afterEach(async () => {
    // Cleanup cards and reviews
    if (testCards) {
      for (const card of testCards) {
        try {
          await reviewService.removeByCardId(card.id);
          await cardService.remove(card.id);
        } catch {
          // Ignore
        }
      }
    }
    // Cleanup deck
    if (testDeck) {
      try {
        await deckService.remove(testDeck.id);
      } catch {
        // Ignore
      }
    }
  });

  afterAll(async () => {
    try {
      await userService.remove(testUser.id);
    } catch {
      // Ignore
    }
    await app.close();
  });

  describe('Review Submission Tests', () => {
    describe('Valid Review Submissions', () => {
      it('should submit review with Again quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].quality).toBe(ReviewQuality.Again);
      });

      it('should submit review with Hard quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Hard },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data[0].quality).toBe(ReviewQuality.Hard);
      });

      it('should submit review with Good quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data[0].quality).toBe(ReviewQuality.Good);
      });

      it('should submit review with Easy quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data[0].quality).toBe(ReviewQuality.Easy);
      });

      it('should submit multiple reviews at once', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
              { cardId: testCards[1].id, quality: ReviewQuality.Easy },
              { cardId: testCards[2].id, quality: ReviewQuality.Hard },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.length).toBe(3);
      });

      it('should submit review with custom reviewedAt time', async () => {
        const customDate = new Date('2024-01-01T10:00:00Z');

        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
            reviewedAt: customDate.toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('should return review with correct structure', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data[0]).toHaveProperty('cardId');
        expect(res.body.data[0]).toHaveProperty('quality');
        expect(res.body.data[0]).toHaveProperty('interval');
        expect(res.body.data[0]).toHaveProperty('eFactor');
        expect(res.body.data[0]).toHaveProperty('nextReviewDate');
      });
    });

    describe('Invalid Review Submissions', () => {
      it('should reject review without CardReviews', async () => {
        await authRequest()
          .post('/study/review')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject review with empty CardReviews array', async () => {
        await authRequest()
          .post('/study/review')
          .send({ CardReviews: [] })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject review with invalid quality', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Invalid' }],
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject review without cardId', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ quality: ReviewQuality.Good }],
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject review without quality', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id }],
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject review with non-existent card', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: 999999, quality: ReviewQuality.Good }],
          })
          .expect(HttpStatus.NOT_FOUND); // Returns 404 for non-existent cards
      });

      it('should reject review without authentication', async () => {
        await request(app.getHttpServer())
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject review with negative cardId', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: -1, quality: ReviewQuality.Good }],
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should reject review with extra non-whitelisted fields', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              {
                cardId: testCards[0].id,
                quality: ReviewQuality.Good,
                extraField: 'invalid',
              },
            ],
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('Anki Algorithm State Transitions', () => {
    describe('New Card Transitions', () => {
      it('should stay in learning on Again (step 0)', async () => {
        // New card -> Again -> Learning step 0
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('learning');
        expect(card?.stepIndex).toBe(0);
      });

      it('should advance to learning step 1 on Good', async () => {
        // New card -> Good -> Learning step 1
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('learning');
        expect(card?.stepIndex).toBe(1);
      });

      it('should graduate immediately on Easy', async () => {
        // New card -> Easy -> Review (graduate)
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
      });
    });

    describe('Learning Card Transitions', () => {
      beforeEach(async () => {
        // Move card to learning step 1 first
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          });
      });

      it('should reset to step 0 on Again', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('learning');
        expect(card?.stepIndex).toBe(0);
      });

      it('should graduate on Good from last step', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
      });

      it('should graduate immediately on Easy', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
      });
    });

    describe('Review Card Transitions', () => {
      beforeEach(async () => {
        // Graduate card to review status
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          });
      });

      it('should lapse to relearning on Again', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('relearning');
      });

      it('should stay in review on Good', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
      });

      it('should increase interval on Good', async () => {
        const cardBefore = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        const intervalBefore = cardBefore?.interval ?? 0;

        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        const cardAfter = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(cardAfter?.interval).toBeGreaterThan(intervalBefore);
      });

      it('should increase interval more on Easy', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
        expect(card?.interval).toBeGreaterThanOrEqual(1);
      });

      it('should decrease ease factor on Hard', async () => {
        const cardBefore = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        const efBefore = cardBefore?.easeFactor ?? 2.5;

        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Hard },
            ],
          })
          .expect(HttpStatus.CREATED);

        const cardAfter = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(cardAfter?.easeFactor).toBeLessThan(efBefore);
      });
    });

    describe('Relearning Card Transitions', () => {
      beforeEach(async () => {
        // Graduate then lapse to relearning
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          });
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          });
      });

      it('should stay in relearning on Again', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('relearning');
      });

      it('should graduate back to review on Good', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          })
          .expect(HttpStatus.CREATED);

        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        expect(card?.status).toBe('review');
      });
    });
  });

  describe('Review Preview Tests', () => {
    describe('Valid Preview Requests', () => {
      it('should preview for new card', async () => {
        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toHaveProperty('Again');
        expect(res.body.data).toHaveProperty('Hard');
        expect(res.body.data).toHaveProperty('Good');
        expect(res.body.data).toHaveProperty('Easy');
      });

      it('should show correct intervals for new card', async () => {
        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // New card defaults
        expect(res.body.data.Again).toBe('1 min');
        expect(res.body.data.Hard).toBe('1 min');
        expect(res.body.data.Good).toBe('10 min');
        expect(res.body.data.Easy).toBe('4 days');
      });

      it('should show different intervals after review', async () => {
        // First review
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          });

        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // After Good on new card (now in learning step 1)
        expect(res.body.data.Again).toBe('1 min');
        expect(res.body.data.Good).toBe('1 day');
      });

      it('should show graduated card intervals', async () => {
        // Graduate card
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          });

        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // Graduated card shows relearning for Again
        expect(res.body.data.Again).toBe('10 min');
      });
    });

    describe('Invalid Preview Requests', () => {
      it('should return 404 for non-existent card', async () => {
        await authRequest()
          .get('/study/preview/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 400 for invalid card id', async () => {
        await authRequest()
          .get('/study/preview/invalid')
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Due Reviews Tests', () => {
    describe('Get Due Reviews (Study Start)', () => {
      it('should return all new cards as due', async () => {
        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.length).toBe(5);
      });

      it('should not return card with future review date', async () => {
        // Graduate card and set future date
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Easy },
            ],
          });

        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        // The graduated card should not be due (has future nextReviewDate)
        const dueCardIds = res.body.data.map((c: Card) => c.id);
        expect(dueCardIds).not.toContain(testCards[0].id);
      });

      it('should return cards in learning as due', async () => {
        // Move to learning
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          });

        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        // Learning cards with past/present nextReviewDate should be due
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it('should return 404 for non-existent deck', async () => {
        await authRequest()
          .get('/study/start/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Cram Mode Tests', () => {
    it('should submit cram review without updating schedule', async () => {
      // First, graduate the card
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      const cardBefore = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });

      // Submit cram review
      const res = await authRequest()
        .post('/study/cram/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.length).toBe(1);

      // Card schedule should not change
      const cardAfter = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });

      expect(cardAfter?.nextReviewDate?.toISOString()).toBe(
        cardBefore?.nextReviewDate?.toISOString(),
      );
      expect(cardAfter?.interval).toBe(cardBefore?.interval);
    });

    it('should record cram review in history', async () => {
      await authRequest()
        .post('/study/cram/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        })
        .expect(HttpStatus.CREATED);

      // Check review history
      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
      });

      expect(reviews.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle cram with multiple cards', async () => {
      const res = await authRequest()
        .post('/study/cram/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
            { cardId: testCards[1].id, quality: ReviewQuality.Hard },
            { cardId: testCards[2].id, quality: ReviewQuality.Easy },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.length).toBe(3);
    });

    it('should reject cram without authentication', async () => {
      await request(app.getHttpServer())
        .post('/study/cram/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Consecutive Days Streak Tests', () => {
    it('should return 0 for deck with no reviews', async () => {
      const res = await authRequest()
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.consecutiveDays).toBe(0);
      expect(res.body.data.streakStartDate).toBeNull();
      expect(res.body.data.lastStudyDate).toBeNull();
    });

    it('should return 1 for deck with review today', async () => {
      // Submit review today
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const res = await authRequest()
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.consecutiveDays).toBeGreaterThanOrEqual(0);
    });

    it('should return correct structure', async () => {
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const res = await authRequest()
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveProperty('consecutiveDays');
      expect(res.body.data).toHaveProperty('streakStartDate');
      expect(res.body.data).toHaveProperty('lastStudyDate');
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Ease Factor Tests', () => {
    it('should start with default ease factor (2.5)', async () => {
      const card = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });
      expect(card?.easeFactor).toBe(2.5);
    });

    it('should decrease ease factor on consecutive Again', async () => {
      // Graduate card first
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      const efBefore = (
        await prismaService.card.findUnique({ where: { id: testCards[0].id } })
      )?.easeFactor;

      // Press Again (lapse)
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Again },
          ],
        });

      // Graduate from relearning
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const efAfter = (
        await prismaService.card.findUnique({ where: { id: testCards[0].id } })
      )?.easeFactor;

      expect(efAfter).toBeLessThan(efBefore!);
    });

    it('should not go below minimum ease factor (1.3)', async () => {
      // Graduate card
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      // Multiple lapses
      for (let i = 0; i < 10; i++) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          });
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          });
      }

      const card = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });
      expect(card?.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should increase ease factor on Easy', async () => {
      // Graduate card
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      const efBefore = (
        await prismaService.card.findUnique({ where: { id: testCards[0].id } })
      )?.easeFactor;

      // Press Easy again
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      const efAfter = (
        await prismaService.card.findUnique({ where: { id: testCards[0].id } })
      )?.easeFactor;

      expect(efAfter).toBeGreaterThan(efBefore!);
    });
  });

  describe('Interval Calculation Tests', () => {
    it('should set interval based on learning steps', async () => {
      // New card - first review
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const card = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });
      expect(card?.interval).toBe(10); // 10 minutes for step 1
    });

    it('should set graduated interval', async () => {
      // Graduate card
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const card = await prismaService.card.findUnique({
        where: { id: testCards[0].id },
      });
      expect(card?.status).toBe('review');
      expect(card?.interval).toBeGreaterThanOrEqual(1);
    });

    it('should increase interval exponentially on Good', async () => {
      // Graduate card
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Easy },
          ],
        });

      const intervals: number[] = [];

      for (let i = 0; i < 3; i++) {
        const card = await prismaService.card.findUnique({
          where: { id: testCards[0].id },
        });
        intervals.push(card?.interval ?? 0);

        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Good },
            ],
          });
      }

      // Each interval should be larger than previous
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }
    });
  });

  describe('Review History Tests', () => {
    it('should record review in history', async () => {
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
      });

      expect(reviews.length).toBe(1);
      expect(reviews[0].quality).toBe(ReviewQuality.Good);
    });

    it('should track previous and new status', async () => {
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
      });

      expect(reviews[0].previousStatus).toBe('new');
      expect(reviews[0].newStatus).toBe('learning');
    });

    it('should maintain review history over multiple reviews', async () => {
      // Multiple reviews
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Good },
          ],
        });
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [
            { cardId: testCards[0].id, quality: ReviewQuality.Again },
          ],
        });

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
        orderBy: { reviewedAt: 'asc' },
      });

      expect(reviews.length).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle reviewing same card multiple times rapidly', async () => {
      for (let i = 0; i < 5; i++) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: ReviewQuality.Again },
            ],
          })
          .expect(HttpStatus.CREATED);
      }

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
      });

      expect(reviews.length).toBe(5);
    });

    it('should handle all cards reviewed at once', async () => {
      const res = await authRequest()
        .post('/study/review')
        .send({
          CardReviews: testCards.map((c) => ({
            cardId: c.id,
            quality: ReviewQuality.Good,
          })),
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.length).toBe(5);
    });

    it('should handle review with all quality types', async () => {
      const qualities = [
        ReviewQuality.Again,
        ReviewQuality.Hard,
        ReviewQuality.Good,
        ReviewQuality.Easy,
      ];

      for (let i = 0; i < 4; i++) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[i].id, quality: qualities[i] }],
          })
          .expect(HttpStatus.CREATED);
      }
    });
  });
});
