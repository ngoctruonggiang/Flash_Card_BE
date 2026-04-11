/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { DeckService } from 'src/services/deck/deck.service';
import { CardService } from 'src/services/card/card.service';
import { ReviewService } from 'src/services/review/review.service';
import { Deck, Card, ReviewQuality } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Error Handling Comprehensive E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;
  let cardService: CardService;
  let reviewService: ReviewService;

  const baseTestUser: SignUpDto = {
    username: 'errorhandler',
    email: 'errorhandler@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  let testUser: AuthResponseDto;
  let testDeck: Deck;
  let testCard: Card;

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

    testUser = await createTestUser(moduleFixture, baseTestUser);
  });

  beforeEach(async () => {
    testDeck = await deckService.create(testUser.id, {
      title: 'Error Test Deck',
    });

    testCard = await cardService.create({
      deckId: testDeck.id,
      front: 'Error Test Front',
      back: 'Error Test Back',
    });
  });

  afterEach(async () => {
    if (testCard) {
      try {
        await reviewService.removeByCardId(testCard.id);
        await cardService.remove(testCard.id);
      } catch {
        // Ignore
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
      // Ignore
    }
    await app.close();
  });

  describe('404 Not Found Errors', () => {
    it('should return 404 for non-existent deck', async () => {
      const res = await authRequest()
        .get('/deck/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 for non-existent card', async () => {
      const res = await authRequest()
        .get('/card/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 for non-existent card preview', async () => {
      const res = await authRequest()
        .get('/study/preview/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 when updating non-existent deck', async () => {
      const res = await authRequest()
        .patch('/deck/999999')
        .send({ title: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 when updating non-existent card', async () => {
      const res = await authRequest()
        .patch('/card/999999')
        .send({ front: 'Updated' })
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 when deleting non-existent deck', async () => {
      const res = await authRequest()
        .delete('/deck/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });

    it('should return 404 when deleting non-existent card', async () => {
      const res = await authRequest()
        .delete('/card/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 404);
    });
  });

  describe('400 Bad Request Errors', () => {
    describe('Invalid ID Format', () => {
      it('should return 400 for invalid deck id format', async () => {
        const res = await authRequest()
          .get('/deck/invalid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('statusCode', 400);
      });

      it('should return 400 for invalid card id format', async () => {
        const res = await authRequest()
          .get('/card/invalid')
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('statusCode', 400);
      });

      it('should return 400 for negative id', async () => {
        await authRequest().get('/deck/-1').expect(HttpStatus.BAD_REQUEST);
      });

      it('should return 400 for float id', async () => {
        await authRequest().get('/deck/1.5').expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Validation Errors', () => {
      it('should return 400 for empty deck title', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({ title: '' })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for missing required card fields', async () => {
        const res = await authRequest()
          .post('/card')
          .send({ deckId: testDeck.id })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for missing deckId in card creation', async () => {
        const res = await authRequest()
          .post('/card')
          .send({ front: 'Front', back: 'Back' })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for invalid review quality', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [{ cardId: testCard.id, quality: 'InvalidQuality' }],
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for empty CardReviews array', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({ CardReviews: [] })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for short username', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'ab',
            email: 'short@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for long username', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'a'.repeat(25),
            email: 'long@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for invalid email format', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'validuser',
            email: 'notanemail',
            password: 'Password123',
            confirmPassword: 'Password123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for weak password', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'validuser',
            email: 'valid@example.com',
            password: 'weak',
            confirmPassword: 'weak',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for password mismatch', async () => {
        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'validuser',
            email: 'valid@example.com',
            password: 'Password123',
            confirmPassword: 'DifferentPassword123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });
    });

    describe('Non-Whitelisted Fields', () => {
      it('should return 400 for extra fields in deck creation', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({ title: 'Valid', extraField: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for extra fields in card creation', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Front',
            back: 'Back',
            extraField: 'invalid',
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });

      it('should return 400 for extra fields in review', async () => {
        const res = await authRequest()
          .post('/study/review')
          .send({
            CardReviews: [
              {
                cardId: testCard.id,
                quality: ReviewQuality.Good,
                extraField: 'invalid',
              },
            ],
          })
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body).toHaveProperty('message');
      });
    });
  });

  describe('401 Unauthorized Errors', () => {
    it('should return 401 without Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .get('/user')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer invalid.token')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 401);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';

      const res = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 with malformed Authorization header', async () => {
      const res = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'NotBearer token')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 for protected deck routes', async () => {
      await request(app.getHttpServer())
        .get('/deck')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for protected card routes', async () => {
      await request(app.getHttpServer())
        .get(`/card/${testCard.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for protected study routes', async () => {
      await request(app.getHttpServer())
        .get(`/study/start/${testDeck.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for protected review routes', async () => {
      await request(app.getHttpServer())
        .post('/study/review')
        .send({
          CardReviews: [{ cardId: testCard.id, quality: ReviewQuality.Good }],
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('403 Forbidden Errors', () => {
    let otherUser: AuthResponseDto;
    let otherUserDeck: Deck;

    beforeAll(async () => {
      // Create another user
      const otherUserDto: SignUpDto = {
        username: 'otheruser',
        email: 'otheruser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(otherUserDto)
        .expect(HttpStatus.CREATED);

      otherUser = res.body.data;

      // Create deck for other user
      otherUserDeck = await deckService.create(otherUser.id, {
        title: 'Other User Deck',
      });
    });

    afterAll(async () => {
      if (otherUserDeck) {
        try {
          await deckService.remove(otherUserDeck.id);
        } catch {
          // Ignore
        }
      }
      if (otherUser) {
        try {
          await userService.remove(otherUser.id);
        } catch {
          // Ignore
        }
      }
    });

    it('should return 403 when accessing another user deck', async () => {
      const res = await authRequest()
        .get(`/deck/${otherUserDeck.id}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });

    it('should return 403 when updating another user deck', async () => {
      const res = await authRequest()
        .patch(`/deck/${otherUserDeck.id}`)
        .send({ title: 'Hacked' })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });

    it('should return 403 when deleting another user deck', async () => {
      const res = await authRequest()
        .delete(`/deck/${otherUserDeck.id}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });

    it('should return 403 when creating card in another user deck', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: otherUserDeck.id,
          front: 'Hacked',
          back: 'Hacked',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });

    it('should return 403 for non-admin accessing admin routes', async () => {
      const res = await authRequest()
        .get('/user/all')
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });

    it('should return 403 for non-admin accessing user by id', async () => {
      const res = await authRequest()
        .get(`/user/${otherUser.id}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 403);
    });
  });

  describe('409 Conflict Errors', () => {
    it('should return 409 for duplicate email registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'newuser123',
          email: baseTestUser.email, // Same email as existing user
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 409);
    });

    it('should return 409 for duplicate username registration', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: baseTestUser.username, // Same username as existing user
          email: 'newemail@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CONFLICT);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 409);
    });
  });

  describe('Error Response Structure', () => {
    it('should have consistent error structure for 400', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode');
      expect(typeof res.body.statusCode).toBe('number');
    });

    it('should have consistent error structure for 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/user')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode');
    });

    it('should have consistent error structure for 403', async () => {
      const res = await authRequest()
        .get('/user/all')
        .expect(HttpStatus.FORBIDDEN);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode');
    });

    it('should have consistent error structure for 404', async () => {
      const res = await authRequest()
        .get('/deck/999999')
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode');
    });

    it('should not expose stack traces in production-like errors', async () => {
      const res = await authRequest()
        .get('/deck/invalid')
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.stack).toBeUndefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should handle SQL injection attempt in query', async () => {
      const res = await authRequest()
        .get("/deck/1' OR '1'='1")
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body).toHaveProperty('message');
    });

    it('should handle SQL injection in POST body', async () => {
      await authRequest()
        .post('/deck')
        .send({ title: "'; DROP TABLE decks; --" })
        .expect(HttpStatus.CREATED); // Should still work as it's just a string
    });

    it('should handle XSS attempt', async () => {
      await authRequest()
        .post('/deck')
        .send({ title: '<script>alert("xss")</script>' })
        .expect(HttpStatus.CREATED); // Frontend responsibility to sanitize display
    });

    it('should handle null byte injection', async () => {
      await authRequest()
        .post('/deck')
        .send({ title: 'Test\x00Deck' })
        .expect(HttpStatus.CREATED);
    });

    it('should handle very large input', async () => {
      await authRequest()
        .post('/deck')
        .send({ title: 'A'.repeat(10000) })
        .expect(HttpStatus.CREATED);
    });
  });

  describe('Content Type Errors', () => {
    it('should handle request with wrong content type', async () => {
      await request(app.getHttpServer())
        .post('/deck')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .set('Content-Type', 'text/plain')
        .send('{"title": "Test"}')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle malformed JSON', async () => {
      await request(app.getHttpServer())
        .post('/deck')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .set('Content-Type', 'application/json')
        .send('{"title": }')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Method Not Allowed', () => {
    it('should return 404 for unsupported methods', async () => {
      await request(app.getHttpServer())
        .put('/deck')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send({ title: 'Test' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Rate Limiting Edge Cases', () => {
    it('should handle many rapid requests', async () => {
      let successCount = 0;
      for (let i = 0; i < 50; i++) {
        const res = await authRequest().get('/deck');
        if (res.status === 200) successCount++;
      }
      expect(successCount).toBe(50);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle accessing deck after deletion', async () => {
      const tempDeck = await deckService.create(testUser.id, {
        title: 'Temp Deck',
      });
      const tempDeckId = tempDeck.id;

      // Delete the deck
      await authRequest().delete(`/deck/${tempDeckId}`).expect(HttpStatus.OK);

      // Try to access deleted deck
      await authRequest()
        .get(`/deck/${tempDeckId}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should handle card creation with deleted deck id', async () => {
      const tempDeck = await deckService.create(testUser.id, {
        title: 'Temp Deck for Card',
      });
      const tempDeckId = tempDeck.id;

      // Delete the deck
      await authRequest().delete(`/deck/${tempDeckId}`).expect(HttpStatus.OK);

      // Try to create card with deleted deck id
      await authRequest()
        .post('/card')
        .send({
          deckId: tempDeckId,
          front: 'Test',
          back: 'Test',
        })
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
