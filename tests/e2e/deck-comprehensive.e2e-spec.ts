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
import { PrismaService } from 'src/services/prisma.service';
import { Deck, CardStatus } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Deck Controller Comprehensive E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;
  let cardService: CardService;
  let prismaService: PrismaService;

  const userSignUpDto: SignUpDto = {
    username: 'deckcomprehensive',
    email: 'deckcomprehensive@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  let testUser: AuthResponseDto;
  let testDeck: Deck | null;

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
      try {
        await deckService.remove(testDeck.id);
      } catch {
        // Ignore if already deleted
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

  describe('/deck (POST) - Create Deck Tests', () => {
    describe('Valid Creation Cases', () => {
      it('should create deck with title only', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({ title: 'Title Only Deck' })
          .expect(HttpStatus.CREATED);

        expect(res.body.data).toBeDefined();
        expect(res.body.data.title).toBe('Title Only Deck');
        expect(res.body.data.userId).toBe(testUser.id);
        expect(res.body.data.description).toBeNull();

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with title and description', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Full Deck',
            description: 'This is a full description',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.title).toBe('Full Deck');
        expect(res.body.data.description).toBe('This is a full description');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with iconName', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Icon Deck',
            iconName: 'book',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.iconName).toBe('book');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with valid colorCode (6 chars)', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Color Deck',
            colorCode: '#FF5733',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.colorCode).toBe('#FF5733');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with valid colorCode (3 chars)', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Short Color Deck',
            colorCode: '#FFF',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.colorCode).toBe('#FFF');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with VN_EN language mode', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'VN EN Deck',
            languageMode: 'VN_EN',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.languageMode).toBe('VN_EN');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with EN_VN language mode', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'EN VN Deck',
            languageMode: 'EN_VN',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.languageMode).toBe('EN_VN');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with BIDIRECTIONAL language mode', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Bidirectional Deck',
            languageMode: 'BIDIRECTIONAL',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.languageMode).toBe('BIDIRECTIONAL');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with all fields', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({
            title: 'Complete Deck',
            description: 'Full description',
            iconName: 'star',
            colorCode: '#123ABC',
            languageMode: 'BIDIRECTIONAL',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.title).toBe('Complete Deck');
        expect(res.body.data.description).toBe('Full description');
        expect(res.body.data.iconName).toBe('star');
        expect(res.body.data.colorCode).toBe('#123ABC');
        expect(res.body.data.languageMode).toBe('BIDIRECTIONAL');

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with very long title', async () => {
        const longTitle = 'A'.repeat(200);
        const res = await authRequest()
          .post('/deck')
          .send({ title: longTitle })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.title).toBe(longTitle);

        await deckService.remove(res.body.data.id);
      });

      it('should create deck with special characters in title', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({ title: 'Deck with émojis 🎉 and спецсимволы' })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.title).toBe('Deck with émojis 🎉 and спецсимволы');

        await deckService.remove(res.body.data.id);
      });

      it('should create multiple decks for same user', async () => {
        const decks = [];
        for (let i = 0; i < 5; i++) {
          const res = await authRequest()
            .post('/deck')
            .send({ title: `Multiple Deck ${i}` })
            .expect(HttpStatus.CREATED);
          decks.push(res.body.data);
        }

        expect(decks.length).toBe(5);

        for (const deck of decks) {
          await deckService.remove(deck.id);
        }
      });

      it('should default to VN_EN language mode if not specified', async () => {
        const res = await authRequest()
          .post('/deck')
          .send({ title: 'Default Language Mode' })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.languageMode).toBe('VN_EN');

        await deckService.remove(res.body.data.id);
      });
    });

    describe('Invalid Creation Cases', () => {
      it('should reject deck without title', async () => {
        await authRequest()
          .post('/deck')
          .send({ description: 'No title' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with empty title', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with null title', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: null })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with invalid colorCode format', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: 'Invalid Color', colorCode: 'not-a-color' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with colorCode without hash', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: 'No Hash', colorCode: 'FF5733' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with colorCode with invalid chars', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: 'Invalid Chars', colorCode: '#GGGGGG' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with invalid language mode', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: 'Invalid Mode', languageMode: 'INVALID' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck with extra non-whitelisted fields', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: 'Extra Fields', extraField: 'not allowed' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject deck creation without authentication', async () => {
        await request(app.getHttpServer())
          .post('/deck')
          .send({ title: 'No Auth' })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject deck with whitespace-only title', async () => {
        await authRequest()
          .post('/deck')
          .send({ title: '   ' })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('/deck (GET) - Get All Decks Tests', () => {
    it('should return all decks for current user', async () => {
      const res = await authRequest().get('/deck').expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return deck with correct structure', async () => {
      const res = await authRequest().get('/deck').expect(HttpStatus.OK);

      const deck = res.body.data.find((d: Deck) => d.id === testDeck?.id);
      expect(deck).toBeDefined();
      expect(deck).toHaveProperty('id');
      expect(deck).toHaveProperty('title');
      expect(deck).toHaveProperty('userId');
      expect(deck).toHaveProperty('createdAt');
      expect(deck).toHaveProperty('updatedAt');
    });

    it('should not return decks from other users', async () => {
      // Create another user
      const otherUserDto: SignUpDto = {
        username: 'otherdeckuser',
        email: 'otherdeckuser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const existingUser = await userService.findByEmail(otherUserDto.email);
      if (existingUser) {
        await userService.remove(existingUser.id);
      }

      const otherUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(otherUserDto)
        .expect(HttpStatus.CREATED);

      const otherToken = otherUserRes.body.data.accessToken;
      const otherUserId = otherUserRes.body.data.id;

      // Create deck for other user
      const otherDeck = await deckService.create(otherUserId, {
        title: 'Other User Deck',
      });

      // Get decks for original user
      const res = await authRequest().get('/deck').expect(HttpStatus.OK);

      const deckIds = res.body.data.map((d: Deck) => d.id);
      expect(deckIds).not.toContain(otherDeck.id);

      // Cleanup
      await deckService.remove(otherDeck.id);
      await userService.remove(otherUserId);
    });

    it('should return empty array for user with no decks', async () => {
      // Create new user with no decks
      const newUserDto: SignUpDto = {
        username: 'nodeckuser',
        email: 'nodeckuser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const existingUser = await userService.findByEmail(newUserDto.email);
      if (existingUser) {
        await userService.remove(existingUser.id);
      }

      const newUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserDto)
        .expect(HttpStatus.CREATED);

      const newToken = newUserRes.body.data.accessToken;

      const res = await request(app.getHttpServer())
        .get('/deck')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toEqual([]);

      await userService.remove(newUserRes.body.data.id);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/deck')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/deck/:id (GET) - Get Single Deck Tests', () => {
    it('should return deck by id', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(testDeck?.id);
      expect(res.body.data.title).toBe(testDeck?.title);
    });

    it('should return deck with cards', async () => {
      // Add cards to test deck
      const card = await cardService.create({
        deckId: testDeck!.id,
        front: 'Test Front',
        back: 'Test Back',
      });

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.cards).toBeDefined();
      expect(res.body.data.cards.length).toBeGreaterThan(0);

      await cardService.remove(card.id);
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest().get('/deck/999999').expect(HttpStatus.NOT_FOUND);
    });

    it('should return 400 for invalid deck id', async () => {
      await authRequest().get('/deck/invalid').expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for negative deck id', async () => {
      await authRequest().get('/deck/-1').expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 400 for decimal deck id', async () => {
      await authRequest().get('/deck/1.5').expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/${testDeck?.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/deck/:id (PATCH) - Update Deck Tests', () => {
    describe('Valid Updates', () => {
      it('should update deck title', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ title: 'Updated Title' })
          .expect(HttpStatus.OK);

        expect(res.body.data.title).toBe('Updated Title');
        expect(res.body.data.description).toBe(testDeck?.description);
      });

      it('should update deck description', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ description: 'Updated Description' })
          .expect(HttpStatus.OK);

        expect(res.body.data.description).toBe('Updated Description');
      });

      it('should update deck iconName', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ iconName: 'heart' })
          .expect(HttpStatus.OK);

        expect(res.body.data.iconName).toBe('heart');
      });

      it('should update deck colorCode', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ colorCode: '#00FF00' })
          .expect(HttpStatus.OK);

        expect(res.body.data.colorCode).toBe('#00FF00');
      });

      it('should update deck languageMode', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ languageMode: 'BIDIRECTIONAL' })
          .expect(HttpStatus.OK);

        expect(res.body.data.languageMode).toBe('BIDIRECTIONAL');
      });

      it('should update multiple fields at once', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({
            title: 'Multi Update',
            description: 'Multi Description',
            iconName: 'star',
          })
          .expect(HttpStatus.OK);

        expect(res.body.data.title).toBe('Multi Update');
        expect(res.body.data.description).toBe('Multi Description');
        expect(res.body.data.iconName).toBe('star');
      });

      it('should clear description by setting to empty string', async () => {
        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ description: '' })
          .expect(HttpStatus.OK);

        expect(res.body.data.description).toBe('');
      });

      it('should update updatedAt timestamp', async () => {
        const before = new Date(testDeck!.updatedAt);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const res = await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ title: 'Timestamp Test' })
          .expect(HttpStatus.OK);

        const after = new Date(res.body.data.updatedAt);
        expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
      });
    });

    describe('Invalid Updates', () => {
      it('should reject update with empty title', async () => {
        await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ title: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject update with invalid colorCode', async () => {
        await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ colorCode: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject update with invalid languageMode', async () => {
        await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ languageMode: 'INVALID' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should return 404 for non-existent deck', async () => {
        await authRequest()
          .patch('/deck/999999')
          .send({ title: 'Update' })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/deck/${testDeck?.id}`)
          .send({ title: 'No Auth Update' })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject with extra non-whitelisted fields', async () => {
        await authRequest()
          .patch(`/deck/${testDeck?.id}`)
          .send({ title: 'Valid', extraField: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('/deck/:id (DELETE) - Delete Deck Tests', () => {
    it('should delete deck', async () => {
      const res = await authRequest()
        .delete(`/deck/${testDeck?.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(testDeck?.id);

      const deleted = await deckService.findOneRaw(testDeck!.id);
      expect(deleted).toBeNull();

      testDeck = null;
    });

    it('should cascade delete cards when deck is deleted', async () => {
      const tempDeck = await deckService.create(testUser.id, {
        title: 'Cascade Delete Test',
      });

      const card = await cardService.create({
        deckId: tempDeck.id,
        front: 'Test',
        back: 'Test',
      });

      await authRequest().delete(`/deck/${tempDeck.id}`).expect(HttpStatus.OK);

      const deletedCard = await cardService.findOneRaw(card.id);
      expect(deletedCard).toBeNull();
    });

    it('should cascade delete reviews when deck is deleted', async () => {
      const tempDeck = await deckService.create(testUser.id, {
        title: 'Review Cascade Test',
      });

      const card = await prismaService.card.create({
        data: {
          deckId: tempDeck.id,
          front: 'Test',
          back: 'Test',
        },
      });

      await prismaService.cardReview.create({
        data: {
          cardId: card.id,
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

      await authRequest().delete(`/deck/${tempDeck.id}`).expect(HttpStatus.OK);

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: card.id },
      });
      expect(reviews).toHaveLength(0);
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest().delete('/deck/999999').expect(HttpStatus.NOT_FOUND);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/deck/${testDeck?.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject deleting already deleted deck', async () => {
      const tempDeck = await deckService.create(testUser.id, {
        title: 'Double Delete Test',
      });

      await authRequest().delete(`/deck/${tempDeck.id}`).expect(HttpStatus.OK);

      await authRequest()
        .delete(`/deck/${tempDeck.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/deck/:id/reviewed-count-day (GET) - Reviewed Count Tests', () => {
    it('should return 0 for deck with no reviews', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/reviewed-count-day`)
        .expect(HttpStatus.OK);

      expect(res.body.data.reviewedCount).toBe(0);
    });

    it('should return count for deck with reviews today', async () => {
      // Create card and review
      const card = await prismaService.card.create({
        data: {
          deckId: testDeck!.id,
          front: 'Test',
          back: 'Test',
        },
      });

      await prismaService.cardReview.create({
        data: {
          cardId: card.id,
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

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/reviewed-count-day`)
        .expect(HttpStatus.OK);

      expect(res.body.data.reviewedCount).toBeGreaterThan(0);
    });

    it('should accept date parameter', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/reviewed-count-day?date=${dateStr}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveProperty('reviewedCount');
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest()
        .get('/deck/999999/reviewed-count-day')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/${testDeck?.id}/reviewed-count-day`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/deck/:id/statistics (GET) - Statistics Tests', () => {
    it('should return statistics for deck', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/statistics`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveProperty('totalReviews');
      expect(res.body.data).toHaveProperty('correctReviews');
      expect(res.body.data).toHaveProperty('correctPercentage');
      expect(res.body.data).toHaveProperty('againCount');
      expect(res.body.data).toHaveProperty('hardCount');
      expect(res.body.data).toHaveProperty('goodCount');
      expect(res.body.data).toHaveProperty('easyCount');
    });

    it('should return 0 for all stats on new deck', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/statistics`)
        .expect(HttpStatus.OK);

      expect(res.body.data.totalReviews).toBe(0);
      expect(res.body.data.correctReviews).toBe(0);
      expect(res.body.data.againCount).toBe(0);
      expect(res.body.data.hardCount).toBe(0);
      expect(res.body.data.goodCount).toBe(0);
      expect(res.body.data.easyCount).toBe(0);
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest()
        .get('/deck/999999/statistics')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/${testDeck?.id}/statistics`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should calculate correct statistics after reviews', async () => {
      const card = await prismaService.card.create({
        data: {
          deckId: testDeck!.id,
          front: 'Stats Test',
          back: 'Stats Test',
        },
      });

      // Create multiple reviews with different qualities
      const qualities = ['Good', 'Easy', 'Hard', 'Again'];
      for (const quality of qualities) {
        await prismaService.cardReview.create({
          data: {
            cardId: card.id,
            repetitions: 1,
            interval: 1,
            eFactor: 2.5,
            nextReviewDate: new Date(),
            reviewedAt: new Date(),
            quality: quality as 'Good' | 'Easy' | 'Hard' | 'Again',
            previousStatus: CardStatus.new,
            newStatus: CardStatus.learning,
          },
        });
      }

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/statistics`)
        .expect(HttpStatus.OK);

      expect(res.body.data.totalReviews).toBe(4);
      expect(res.body.data.goodCount).toBe(1);
      expect(res.body.data.easyCount).toBe(1);
      expect(res.body.data.hardCount).toBe(1);
      expect(res.body.data.againCount).toBe(1);
    });
  });

  describe('/deck/:id/last-studied (GET) - Last Studied Tests', () => {
    it('should return null for never studied deck', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/last-studied`)
        .expect(HttpStatus.OK);

      expect(res.body.data.lastStudied).toBeNull();
    });

    it('should return date for studied deck', async () => {
      const card = await prismaService.card.create({
        data: {
          deckId: testDeck!.id,
          front: 'Last Study Test',
          back: 'Last Study Test',
        },
      });

      const reviewDate = new Date();
      await prismaService.cardReview.create({
        data: {
          cardId: card.id,
          repetitions: 1,
          interval: 1,
          eFactor: 2.5,
          nextReviewDate: new Date(),
          reviewedAt: reviewDate,
          quality: 'Good',
          previousStatus: CardStatus.new,
          newStatus: CardStatus.learning,
        },
      });

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/last-studied`)
        .expect(HttpStatus.OK);

      expect(res.body.data.lastStudied).toBeDefined();
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest()
        .get('/deck/999999/last-studied')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/${testDeck?.id}/last-studied`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/deck/:id/due-today (GET) - Due Today Tests', () => {
    it('should return empty array for deck with no due cards', async () => {
      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should return new cards as due', async () => {
      await cardService.create({
        deckId: testDeck!.id,
        front: 'Due Test',
        back: 'Due Test',
      });

      const res = await authRequest()
        .get(`/deck/${testDeck?.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent deck', async () => {
      await authRequest()
        .get('/deck/999999/due-today')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/${testDeck?.id}/due-today`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/deck/by (GET) - Admin Get Decks Tests', () => {
    let adminUser: AuthResponseDto;

    beforeAll(async () => {
      const adminDto: SignUpDto = {
        username: 'deckadminuser',
        email: 'deckadminuser@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };

      const existing = await userService.findByEmail(adminDto.email);
      if (existing) {
        await userService.remove(existing.id);
      }

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminDto)
        .expect(HttpStatus.CREATED);

      adminUser = res.body.data;

      // Promote to admin
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({ role: 'ADMIN' });
    });

    afterAll(async () => {
      if (adminUser) {
        try {
          await userService.remove(adminUser.id);
        } catch {
          // Ignore
        }
      }
    });

    it('should allow admin to get decks by userId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/deck/by?userId=${testUser.id}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should reject non-admin user', async () => {
      await authRequest()
        .get(`/deck/by?userId=${testUser.id}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/deck/by?userId=${testUser.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
