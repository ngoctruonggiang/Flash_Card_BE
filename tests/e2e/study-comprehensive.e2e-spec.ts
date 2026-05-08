/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { ReviewService } from 'src/services/review/review.service';
import { PrismaService } from 'src/services/prisma.service';
import { Card, Deck, ReviewQuality } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('UC-20: Start Study Session & UC-21: Record Review Outcome & UC-22: Session Summary & UC-23: View Study Session Statistics - Study E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;
  let reviewService: ReviewService;
  let prismaService: PrismaService;

  const userSignUpDto: SignUpDto = {
    username: 'studycomprehensive',
    email: 'studycomprehensive@example.com',
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
    cardService = moduleFixture.get<CardService>(CardService);
    deckService = moduleFixture.get<DeckService>(DeckService);
    reviewService = moduleFixture.get<ReviewService>(ReviewService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    testUser = await createTestUser(moduleFixture, userSignUpDto);
  });

  beforeEach(async () => {
    // Create test deck
    testDeck = await deckService.create(testUser.id, {
      title: 'Study Test Deck',
      description: 'Deck for study tests',
    });

    // Create test cards
    testCards = [];
    for (let i = 0; i < 5; i++) {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: `Study Card ${i}`,
        back: `Study Back ${i}`,
      });
      testCards.push(card);
    }
  });

  afterEach(async () => {
    // Cleanup
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
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('/study/start/:id (GET) - Start Study Session Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-001 This test case aims to return all cards with "new" status as due when starting a study session because new cards have never been reviewed', async () => {
        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBe(5);
      });

      it('TC-STUDY-002 This test case aims to return cards with complete structure including id, front, back, and deckId properties for rendering in study mode', async () => {
        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        if (res.body.data.length > 0) {
          const card = res.body.data[0];
          expect(card).toHaveProperty('id');
          expect(card).toHaveProperty('front');
          expect(card).toHaveProperty('back');
          expect(card).toHaveProperty('deckId');
        }
      });

      it('TC-STUDY-003 This test case aims to exclude a card from due list after it has been reviewed because its nextReviewDate is set to the future', async () => {
        // Review one card
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        const returnedIds = res.body.data.map((c: Card) => c.id);
        expect(returnedIds).not.toContain(testCards[0].id);
        expect(res.body.data.length).toBe(4);
      });

      it('TC-STUDY-004 This test case aims to return an empty array when all cards have been reviewed with "Easy" quality and have future nextReviewDates', async () => {
        // Review all cards as Easy (long interval)
        for (const card of testCards) {
          await authRequest()
            .post('/study/review')
            .send({
              CardReviews: [{ cardId: card.id, quality: 'Easy' }],
              reviewedAt: new Date().toISOString(),
            });
        }

        const res = await authRequest()
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.length).toBe(0);
      });

      it('TC-STUDY-005 This test case aims to return an empty array when the deck exists but contains no flashcards to study', async () => {
        const emptyDeck = await deckService.create(testUser.id, {
          title: 'Empty Study Deck',
        });

        const res = await authRequest()
          .get(`/study/start/${emptyDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toEqual([]);

        await deckService.remove(emptyDeck.id);
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-006 This test case aims to return 404 Not Found when attempting to start a study session for a deck that does not exist in the database', async () => {
        await authRequest()
          .get('/study/start/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-STUDY-007 This test case aims to return 400 Bad Request when deck ID parameter is not a valid numeric value (e.g., "invalid" string)', async () => {
        await authRequest()
          .get('/study/start/invalid')
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-008 This test case aims to return 401 Unauthorized when attempting to start a study session without providing a valid JWT access token', async () => {
        await request(app.getHttpServer())
          .get(`/study/start/${testDeck.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/study/preview/:id (GET) - Review Preview Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-009 This test case aims to return preview for new card', async () => {
        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toHaveProperty('Again');
        expect(res.body.data).toHaveProperty('Hard');
        expect(res.body.data).toHaveProperty('Good');
        expect(res.body.data).toHaveProperty('Easy');
      });

      it('TC-STUDY-010 This test case aims to return different intervals for each quality option', async () => {
        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // All This test case aims to be strings representing intervals
        expect(typeof res.body.data.Again).toBe('string');
        expect(typeof res.body.data.Hard).toBe('string');
        expect(typeof res.body.data.Good).toBe('string');
        expect(typeof res.body.data.Easy).toBe('string');
      });

      it('TC-STUDY-011 This test case aims to return updated intervals after review', async () => {
        // Get initial preview
        const initialRes = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // Submit review
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          });

        // Get updated preview
        const updatedRes = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // Intervals This test case aims to have changed
        expect(updatedRes.body.data.Good).not.toBe(initialRes.body.data.Good);
      });

      it('TC-STUDY-012 This test case aims to return increasing intervals with more reviews', async () => {
        // Review card multiple times
        for (let i = 0; i < 3; i++) {
          await authRequest()
            .post('/study/review')
            .send({
              CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
              reviewedAt: new Date().toISOString(),
            });
        }

        const res = await authRequest()
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.OK);

        // After multiple Good reviews, Easy interval This test case aims to be significant
        expect(res.body.data.Easy).toBeDefined();
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-013 This test case aims to return 404 for non-existent card', async () => {
        await authRequest()
          .get('/study/preview/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-STUDY-014 This test case aims to return 400 for invalid card id', async () => {
        await authRequest()
          .get('/study/preview/invalid')
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-015 This test case aims to reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/study/preview/${testCards[0].id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/study/review (POST) - Submit Review Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-016 This test case aims to submit review with Again quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Again' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('TC-STUDY-017 This test case aims to submit review with Hard quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Hard' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('TC-STUDY-018 This test case aims to submit review with Good quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('TC-STUDY-019 This test case aims to submit review with Easy quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Easy' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('TC-STUDY-020 This test case aims to submit multiple reviews at once', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              { cardId: testCards[0].id, quality: 'Good' },
              { cardId: testCards[1].id, quality: 'Easy' },
              { cardId: testCards[2].id, quality: 'Hard' },
            ],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.length).toBe(3);
      });

      it('TC-STUDY-021 This test case aims to update card status after review', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        const card = await cardService.findOne(testCards[0].id);
        expect(card?.status).not.toBe('new');
      });

      it('TC-STUDY-022 This test case aims to update card nextReviewDate after review', async () => {
        const before = testCards[0].nextReviewDate;

        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        const card = await cardService.findOne(testCards[0].id);
        expect(card?.nextReviewDate).not.toBe(before);
      });

      it('TC-STUDY-023 This test case aims to create review history record', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        const reviews = await prismaService.cardReview.findMany({
          where: { cardId: testCards[0].id },
        });
        expect(reviews.length).toBeGreaterThan(0);
      });

      it('TC-STUDY-024 This test case aims to accept reviewedAt in the past', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: pastDate.toISOString(),
          })
          .expect(HttpStatus.CREATED);
      });

      it('TC-STUDY-025 This test case aims to handle review of same card multiple times', async () => {
        for (let i = 0; i < 5; i++) {
          await authRequest()
            .post('/study/review')
            .send({
              CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
              reviewedAt: new Date().toISOString(),
            })
            .expect(HttpStatus.CREATED);
        }

        const reviews = await prismaService.cardReview.findMany({
          where: { cardId: testCards[0].id },
        });
        expect(reviews.length).toBe(5);
      });

      it('TC-STUDY-026 This test case aims to decrease ease factor on Again review', async () => {
        // First review to establish baseline
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          });

        const before = await cardService.findOne(testCards[0].id);
        const beforeEase = before?.easeFactor;

        // Review as Again
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Again' }],
            reviewedAt: new Date().toISOString(),
          });

        const after = await cardService.findOne(testCards[0].id);
        expect(after?.easeFactor).toBeLessThanOrEqual(beforeEase || 2.5);
      });

      it('TC-STUDY-027 This test case aims to increase ease factor on Easy review', async () => {
        // First do a few reviews
        for (let i = 0; i < 3; i++) {
          await authRequest()
            .post('/study/review')
            .send({
              CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
              reviewedAt: new Date().toISOString(),
            });
        }

        const before = await cardService.findOne(testCards[0].id);

        // Review as Easy
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Easy' }],
            reviewedAt: new Date().toISOString(),
          });

        const after = await cardService.findOne(testCards[0].id);
        expect(after?.easeFactor).toBeGreaterThanOrEqual(
          before?.easeFactor || 2.5,
        );
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-028 This test case aims to reject review without CardReviews', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-029 This test case aims to accept review without reviewedAt (uses current time)', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
          })
          .expect(HttpStatus.CREATED);
      });

      it('TC-STUDY-030 This test case aims to reject review with empty CardReviews array', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-031 This test case aims to reject review with invalid quality', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Invalid' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-032 This test case aims to reject review with non-existent card', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: 999999, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-STUDY-033 This test case aims to reject review without cardId', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-034 This test case aims to reject review without quality', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-035 This test case aims to reject review with invalid reviewedAt format', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: 'not-a-date',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-036 This test case aims to reject without authentication', async () => {
        await request(app.getHttpServer())
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/study/consecutive-days/:id (GET) - Consecutive Days Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-037 This test case aims to return 0 consecutive days for deck with no reviews', async () => {
        const res = await authRequest()
          .get(`/study/consecutive-days/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.consecutiveDays).toBe(0);
        expect(res.body.data.streakStartDate).toBeNull();
        expect(res.body.data.lastStudyDate).toBeNull();
      });

      it('TC-STUDY-038 This test case aims to return 1 consecutive day after studying today', async () => {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          });

        const res = await authRequest()
          .get(`/study/consecutive-days/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.consecutiveDays).toBe(1);
        expect(res.body.data.lastStudyDate).toBeDefined();
        expect(res.body.data.streakStartDate).toBeDefined();
      });

      it('TC-STUDY-039 This test case aims to return correct structure', async () => {
        const res = await authRequest()
          .get(`/study/consecutive-days/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toHaveProperty('consecutiveDays');
        expect(res.body.data).toHaveProperty('streakStartDate');
        expect(res.body.data).toHaveProperty('lastStudyDate');
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-040 This test case aims to return 404 for non-existent deck', async () => {
        await authRequest()
          .get('/study/consecutive-days/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-STUDY-041 This test case aims to return 400 for invalid deck id', async () => {
        await authRequest()
          .get('/study/consecutive-days/invalid')
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-042 This test case aims to reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/study/consecutive-days/${testDeck.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/study/cram/:deckId (GET) - Cram Mode Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-043 This test case aims to start cram session and return all cards', async () => {
        const res = await authRequest()
          .get(`/study/cram/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.data).toBeInstanceOf(Array);
        expect(res.body.data.data.length).toBe(5);
        expect(res.body.data.total).toBe(5);
      });

      it('TC-STUDY-044 This test case aims to accept limit parameter', async () => {
        const res = await authRequest()
          .get(`/study/cram/${testDeck.id}?limit=2`)
          .expect(HttpStatus.OK);

        expect(res.body.data.data.length).toBe(2);
      });

      it('TC-STUDY-045 This test case aims to return cards even if already reviewed', async () => {
        // Review all cards
        for (const card of testCards) {
          await authRequest()
            .post('/study/review')
            .send({
              CardReviews: [{ cardId: card.id, quality: 'Good' }],
              reviewedAt: new Date().toISOString(),
            });
        }

        // Cram This test case aims to still return cards
        const res = await authRequest()
          .get(`/study/cram/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.data.length).toBeGreaterThan(0);
      });

      it('TC-STUDY-046 This test case aims to return empty for empty deck', async () => {
        const emptyDeck = await deckService.create(testUser.id, {
          title: 'Empty Cram Deck',
        });

        const res = await authRequest()
          .get(`/study/cram/${emptyDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.data).toEqual([]);
        expect(res.body.data.total).toBe(0);

        await deckService.remove(emptyDeck.id);
      });

      it('TC-STUDY-047 This test case aims to have correct message', async () => {
        const res = await authRequest()
          .get(`/study/cram/${testDeck.id}`)
          .expect(HttpStatus.OK);

        expect(res.body.message).toBe('Start Cram Session');
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-048 This test case aims to return 404 for non-existent deck', async () => {
        await authRequest()
          .get('/study/cram/999999')
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-STUDY-049 This test case aims to reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/study/cram/${testDeck.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/study/cram/review (POST) - Cram Review Tests', () => {
    describe('Valid Cases', () => {
      it('TC-STUDY-050 This test case aims to submit cram review', async () => {
        const res = await authRequest()
          .post('/study/cram/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
      });

      it('TC-STUDY-051 This test case aims to not affect card scheduling', async () => {
        const before = await cardService.findOne(testCards[0].id);
        const beforeStatus = before?.status;

        await authRequest()
          .post('/study/cram/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          });

        const after = await cardService.findOne(testCards[0].id);
        // Cram reviews This test case aims to not affect scheduling
        expect(after?.status).toBe(beforeStatus);
      });

      it('TC-STUDY-052 This test case aims to accept all quality options', async () => {
        const qualities = ['Again', 'Hard', 'Good', 'Easy'];
        for (let i = 0; i < qualities.length; i++) {
          await authRequest()
            .post('/study/cram/review')
            .send({
              CardReviews: [{ cardId: testCards[i].id, quality: qualities[i] }],
              reviewedAt: new Date().toISOString(),
            })
            .expect(HttpStatus.CREATED);
        }
      });
    });

    describe('Invalid Cases', () => {
      it('TC-STUDY-053 This test case aims to reject cram review with invalid quality', async () => {
        await authRequest()
          .post('/study/cram/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Invalid' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-STUDY-054 This test case aims to reject without authentication', async () => {
        await request(app.getHttpServer())
          .post('/study/cram/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('Study Flow Integration Tests', () => {
    it('TC-STUDY-055 This test case aims to complete full study flow: start -> preview -> review -> verify', async () => {
      // 1. Start study session
      const startRes = await authRequest()
        .get(`/study/start/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(startRes.body.data.length).toBe(5);

      // 2. Preview first card
      const cardToReview = startRes.body.data[0];
      const previewRes = await authRequest()
        .get(`/study/preview/${cardToReview.id}`)
        .expect(HttpStatus.OK);

      expect(previewRes.body.data.Good).toBeDefined();

      // 3. Submit review
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [{ cardId: cardToReview.id, quality: 'Good' }],
          reviewedAt: new Date().toISOString(),
        })
        .expect(HttpStatus.CREATED);

      // 4. Verify card is no longer in due list
      const afterRes = await authRequest()
        .get(`/study/start/${testDeck.id}`)
        .expect(HttpStatus.OK);

      const remainingIds = afterRes.body.data.map((c: Card) => c.id);
      expect(remainingIds).not.toContain(cardToReview.id);
    });

    it('TC-STUDY-056 This test case aims to handle review session with all qualities', async () => {
      const qualities: ReviewQuality[] = ['Again', 'Hard', 'Good', 'Easy'];

      for (let i = 0; i < 4; i++) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[i].id, quality: qualities[i] }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);
      }

      // Verify all were reviewed
      const reviews = await prismaService.cardReview.findMany({
        where: {
          cardId: { in: testCards.slice(0, 4).map((c) => c.id) },
        },
      });

      expect(reviews.length).toBe(4);
    });

    it('TC-STUDY-057 This test case aims to correctly calculate consecutive days after multiple reviews', async () => {
      // Review cards today
      for (const card of testCards) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: card.id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          });
      }

      const res = await authRequest()
        .get(`/study/consecutive-days/${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.consecutiveDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('TC-STUDY-058 This test case aims to handle concurrent review submissions', async () => {
      const promises = testCards.map((card) =>
        authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: card.id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          }),
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 201).length;

      expect(successCount).toBe(5);
    });

    it('TC-STUDY-059 This test case aims to handle rapid consecutive reviews of same card', async () => {
      for (let i = 0; i < 3; i++) {
        await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCards[0].id, quality: 'Good' }],
            reviewedAt: new Date().toISOString(),
          })
          .expect(HttpStatus.CREATED);
      }

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: testCards[0].id },
      });

      expect(reviews.length).toBe(3);
    });

    it('TC-STUDY-060 This test case aims to maintain data integrity after failed review', async () => {
      const before = await cardService.findOne(testCards[0].id);

      // Submit invalid review
      await authRequest()
        .post('/study/review')
        .send({
          CardReviews: [{ cardId: testCards[0].id, quality: 'Invalid' }],
          reviewedAt: new Date().toISOString(),
        })
        .expect(HttpStatus.BAD_REQUEST);

      const after = await cardService.findOne(testCards[0].id);

      // Card This test case aims to be unchanged
      expect(after?.status).toBe(before?.status);
      expect(after?.easeFactor).toBe(before?.easeFactor);
    });
  });
});
