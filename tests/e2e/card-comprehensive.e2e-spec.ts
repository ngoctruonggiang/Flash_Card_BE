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
import { PrismaService } from 'src/services/prisma.service';
import { Card, Deck, CardStatus } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';
import { LanguageMode } from 'src/utils/types/dto/deck/createDeck.dto';

describe('UC-13: Browse Deck Cards & UC-14: Add Card & UC-15: Edit Card & UC-16: Delete Card & UC-17: View Card Statistics - Card E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;
  let prismaService: PrismaService;

  const userSignUpDto: SignUpDto = {
    username: 'cardcomprehensive',
    email: 'cardcomprehensive@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  let testUser: AuthResponseDto;
  let testDeck: Deck;
  let testCard: Card | null;

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
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    testUser = await createTestUser(moduleFixture, userSignUpDto);

    testDeck = await deckService.create(testUser.id, {
      title: 'Card Test Deck',
      description: 'Deck for card tests',
    });
  });

  beforeEach(async () => {
    testCard = await cardService.create({
      deckId: testDeck.id,
      front: 'Test Front',
      back: 'Test Back',
    });
  });

  afterEach(async () => {
    if (testCard) {
      try {
        await cardService.remove(testCard.id);
      } catch {
        // Ignore if already deleted
      }
    }
  });

  afterAll(async () => {
    try {
      await deckService.remove(testDeck.id);
      await userService.remove(testUser.id);
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('/card (POST) - Create Card Tests', () => {
    describe('Valid Creation Cases', () => {
      it('TC-CARD-001 should create card with required fields only', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Simple Front',
            back: 'Simple Back',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toBe('Simple Front');
        expect(res.body.data.back).toBe('Simple Back');
        expect(res.body.data.deckId).toBe(testDeck.id);

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-002 should create card with tags', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Tagged Front',
            back: 'Tagged Back',
            tags: 'tag1,tag2,tag3',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.tags).toBe('tag1,tag2,tag3');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-003 should create card with wordType', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Noun Front',
            back: 'Noun Back',
            wordType: 'noun',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.wordType).toBe('noun');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-004 should create card with pronunciation', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Hello',
            back: 'Xin chào',
            pronunciation: '/həˈləʊ/',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.pronunciation).toBe('/həˈləʊ/');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-005 should create card with examples', async () => {
        const examples = [
          {
            sentence: 'Hello, how are you?',
            translation: 'Xin chào, bạn khỏe không?',
          },
          { sentence: 'Hello world!', translation: 'Xin chào thế giới!' },
        ];

        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Hello',
            back: 'Xin chào',
            examples,
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.examples).toHaveLength(2);

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-006 should create card with all optional fields', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Complete Front',
            back: 'Complete Back',
            tags: 'tag1,tag2',
            wordType: 'verb',
            pronunciation: '/test/',
            examples: [{ sentence: 'Test sentence', translation: 'Câu test' }],
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toBe('Complete Front');
        expect(res.body.data.back).toBe('Complete Back');
        expect(res.body.data.tags).toBe('tag1,tag2');
        expect(res.body.data.wordType).toBe('verb');
        expect(res.body.data.pronunciation).toBe('/test/');
        expect(res.body.data.examples).toHaveLength(1);

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-007 should create card with long text content', async () => {
        const longText = 'A'.repeat(1000);
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: longText,
            back: longText,
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toBe(longText);
        expect(res.body.data.back).toBe(longText);

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-008 should create card with special characters', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: '你好 🎉 Привет',
            back: 'Hello in multiple languages',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toBe('你好 🎉 Привет');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-009 should create card with HTML-like content', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: '<b>Bold</b> and <i>italic</i>',
            back: 'HTML formatted',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toBe('<b>Bold</b> and <i>italic</i>');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-010 should create card with newlines in content', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Line 1\nLine 2\nLine 3',
            back: 'Multiple lines',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.front).toContain('Line 1');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-011 should create multiple cards in same deck', async () => {
        const cards: Card[] = [];
        for (let i = 0; i < 10; i++) {
          const res = await authRequest()
            .post('/card')
            .send({
              deckId: testDeck.id,
              front: `Multiple Card ${i}`,
              back: `Back ${i}`,
            })
            .expect(HttpStatus.CREATED);
          cards.push(res.body.data);
        }

        expect(cards.length).toBe(10);

        for (const card of cards) {
          await cardService.remove(card.id);
        }
      });

      it('TC-CARD-012 should initialize card with default status', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Status Test',
            back: 'Status Test',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.status).toBe('new');

        await cardService.remove(res.body.data.id);
      });

      it('TC-CARD-013 should initialize card with default ease factor', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Ease Test',
            back: 'Ease Test',
          })
          .expect(HttpStatus.CREATED);

        expect(res.body.data.easeFactor).toBe(2.5);

        await cardService.remove(res.body.data.id);
      });
    });

    describe('Invalid Creation Cases', () => {
      it('TC-CARD-014 should reject card without deckId', async () => {
        await authRequest()
          .post('/card')
          .send({
            front: 'No Deck',
            back: 'No Deck',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-015 should reject card without front', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            back: 'No Front',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-016 should reject card without back', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'No Back',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-017 should reject card with empty front', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: '',
            back: 'Empty Front',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-018 should reject card with empty back', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Empty Back',
            back: '',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-019 should reject card with non-existent deckId', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: 999999,
            front: 'Bad Deck',
            back: 'Bad Deck',
          })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-CARD-020 should reject card with negative deckId', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: -1,
            front: 'Negative Deck',
            back: 'Negative Deck',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-021 should reject card with string deckId', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: 'invalid',
            front: 'String Deck',
            back: 'String Deck',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-022 should reject card with null front', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: null,
            back: 'Null Front',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-023 should reject card with null back', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Null Back',
            back: null,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-024 should reject card with invalid examples format', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Invalid Examples',
            back: 'Invalid Examples',
            examples: 'not an array',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-025 should reject card with incomplete example objects', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Incomplete Example',
            back: 'Incomplete Example',
            examples: [{ sentence: 'Only sentence' }],
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-026 should reject card with extra non-whitelisted fields', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Extra Fields',
            back: 'Extra Fields',
            extraField: 'not allowed',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-027 should reject card creation without authentication', async () => {
        await request(app.getHttpServer())
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'No Auth',
            back: 'No Auth',
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('TC-CARD-028 should reject card with whitespace-only front', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: '   ',
            back: 'Whitespace Front',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-029 should reject card with whitespace-only back', async () => {
        await authRequest()
          .post('/card')
          .send({
            deckId: testDeck.id,
            front: 'Whitespace Back',
            back: '   ',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Bidirectional Deck Card Creation', () => {
      let bidirectionalDeck: Deck;

      beforeAll(async () => {
        bidirectionalDeck = await deckService.create(testUser.id, {
          title: 'Bidirectional Test Deck',
          languageMode: LanguageMode.BIDIRECTIONAL,
        });
      });

      afterAll(async () => {
        try {
          await deckService.remove(bidirectionalDeck.id);
        } catch {
          // Ignore
        }
      });

      it('TC-CARD-030 should create two cards for bidirectional deck', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: bidirectionalDeck.id,
            front: 'Bidirectional Front',
            back: 'Bidirectional Back',
          })
          .expect(HttpStatus.CREATED);

        const allCards = await cardService.findByDeck(bidirectionalDeck.id);
        expect(allCards.length).toBeGreaterThanOrEqual(2);

        // Cleanup
        for (const card of allCards) {
          await cardService.remove(card.id);
        }
      });

      it('TC-CARD-031 should create reverse card with swapped front/back', async () => {
        const res = await authRequest()
          .post('/card')
          .send({
            deckId: bidirectionalDeck.id,
            front: 'Original Front',
            back: 'Original Back',
          })
          .expect(HttpStatus.CREATED);

        const allCards = await cardService.findByDeck(bidirectionalDeck.id);
        const reverseCard = allCards.find(
          (c) => c.front === 'Original Back' && c.back === 'Original Front',
        );
        expect(reverseCard).toBeDefined();

        // Cleanup
        for (const card of allCards) {
          await cardService.remove(card.id);
        }
      });
    });
  });

  describe('/card (GET) - Get All Cards Tests', () => {
    it('TC-CARD-032 should return all cards for user', async () => {
      const res = await authRequest().get('/card').expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('TC-CARD-033 should return cards filtered by deckId', async () => {
      const res = await authRequest()
        .get(`/card?deckId=${testDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toBeInstanceOf(Array);
      for (const card of res.body.data) {
        expect(card.deckId).toBe(testDeck.id);
      }
    });

    it('TC-CARD-034 should return empty array for deck with no cards', async () => {
      const emptyDeck = await deckService.create(testUser.id, {
        title: 'Empty Deck',
      });

      const res = await authRequest()
        .get(`/card?deckId=${emptyDeck.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toEqual([]);

      await deckService.remove(emptyDeck.id);
    });

    it('TC-CARD-035 should return card with correct structure', async () => {
      const res = await authRequest()
        .get(`/card?deckId=${testDeck.id}`)
        .expect(HttpStatus.OK);

      if (res.body.data.length > 0) {
        const card = res.body.data[0];
        expect(card).toHaveProperty('id');
        expect(card).toHaveProperty('deckId');
        expect(card).toHaveProperty('front');
        expect(card).toHaveProperty('back');
        expect(card).toHaveProperty('createdAt');
        expect(card).toHaveProperty('updatedAt');
      }
    });

    it('TC-CARD-036 should reject invalid deckId parameter', async () => {
      await authRequest()
        .get('/card?deckId=invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('TC-CARD-037 should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get('/card')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/card/:id (GET) - Get Single Card Tests', () => {
    it('TC-CARD-038 should return card by id', async () => {
      const res = await authRequest()
        .get(`/card/${testCard?.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(testCard?.id);
      expect(res.body.data.front).toBe(testCard?.front);
      expect(res.body.data.back).toBe(testCard?.back);
    });

    it('TC-CARD-039 should return card with all properties', async () => {
      const fullCard = await cardService.create({
        deckId: testDeck.id,
        front: 'Full Card',
        back: 'Full Card Back',
        tags: 'test',
        wordType: 'noun',
        pronunciation: '/test/',
        examples: [{ sentence: 'Test', translation: 'Test' }],
      });

      const res = await authRequest()
        .get(`/card/${fullCard.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.tags).toBe('test');
      expect(res.body.data.wordType).toBe('noun');
      expect(res.body.data.pronunciation).toBe('/test/');

      await cardService.remove(fullCard.id);
    });

    it('TC-CARD-040 should return 404 for non-existent card', async () => {
      await authRequest().get('/card/999999').expect(HttpStatus.NOT_FOUND);
    });

    it('TC-CARD-041 should return 400 for invalid card id', async () => {
      await authRequest().get('/card/invalid').expect(HttpStatus.BAD_REQUEST);
    });

    it('TC-CARD-042 should return 400 for negative card id', async () => {
      await authRequest().get('/card/-1').expect(HttpStatus.BAD_REQUEST);
    });

    it('TC-CARD-043 should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/card/${testCard?.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/card/:id (PATCH) - Update Card Tests', () => {
    describe('Valid Updates', () => {
      it('TC-CARD-044 should update card front', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ front: 'Updated Front' })
          .expect(HttpStatus.OK);

        expect(res.body.data.front).toBe('Updated Front');
        expect(res.body.data.back).toBe(testCard?.back);
      });

      it('TC-CARD-045 should update card back', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ back: 'Updated Back' })
          .expect(HttpStatus.OK);

        expect(res.body.data.back).toBe('Updated Back');
      });

      it('TC-CARD-046 should update card tags', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ tags: 'new,tags' })
          .expect(HttpStatus.OK);

        expect(res.body.data.tags).toBe('new,tags');
      });

      it('TC-CARD-047 should update card wordType', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ wordType: 'adjective' })
          .expect(HttpStatus.OK);

        expect(res.body.data.wordType).toBe('adjective');
      });

      it('TC-CARD-048 should update card pronunciation', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ pronunciation: '/njuː/' })
          .expect(HttpStatus.OK);

        expect(res.body.data.pronunciation).toBe('/njuː/');
      });

      it('TC-CARD-049 should update card examples', async () => {
        const newExamples = [
          { sentence: 'New example', translation: 'Ví dụ mới' },
        ];

        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ examples: newExamples })
          .expect(HttpStatus.OK);

        expect(res.body.data.examples).toHaveLength(1);
      });

      it('TC-CARD-050 should update multiple fields at once', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({
            front: 'Multi Update Front',
            back: 'Multi Update Back',
            tags: 'multi,update',
          })
          .expect(HttpStatus.OK);

        expect(res.body.data.front).toBe('Multi Update Front');
        expect(res.body.data.back).toBe('Multi Update Back');
        expect(res.body.data.tags).toBe('multi,update');
      });

      it('TC-CARD-051 should clear tags by setting to empty string', async () => {
        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ tags: '' })
          .expect(HttpStatus.OK);

        expect(res.body.data.tags).toBe('');
      });

      it('TC-CARD-052 should update updatedAt timestamp', async () => {
        const before = new Date(testCard!.updatedAt);

        await new Promise((resolve) => setTimeout(resolve, 100));

        const res = await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ front: 'Timestamp Update' })
          .expect(HttpStatus.OK);

        const after = new Date(res.body.data.updatedAt);
        expect(after.getTime()).toBeGreaterThanOrEqual(before.getTime());
      });
    });

    describe('Invalid Updates', () => {
      it('TC-CARD-053 should reject update with empty front', async () => {
        await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ front: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-054 should reject update with empty back', async () => {
        await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ back: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-055 should reject update with invalid examples', async () => {
        await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ examples: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-CARD-056 should return 404 for non-existent card', async () => {
        await authRequest()
          .patch('/card/999999')
          .send({ front: 'Update' })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('TC-CARD-057 should reject without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/card/${testCard?.id}`)
          .send({ front: 'No Auth' })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('TC-CARD-058 should reject with extra non-whitelisted fields', async () => {
        await authRequest()
          .patch(`/card/${testCard?.id}`)
          .send({ front: 'Valid', extraField: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('/card/:id (DELETE) - Delete Card Tests', () => {
    it('TC-CARD-059 should delete card', async () => {
      const res = await authRequest()
        .delete(`/card/${testCard?.id}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.id).toBe(testCard?.id);

      const deleted = await cardService.findOneRaw(testCard!.id);
      expect(deleted).toBeNull();

      testCard = null;
    });

    it('TC-CARD-060 should cascade delete reviews when card is deleted', async () => {
      const cardWithReviews = await cardService.create({
        deckId: testDeck.id,
        front: 'Review Delete Test',
        back: 'Review Delete Test',
      });

      await prismaService.cardReview.create({
        data: {
          cardId: cardWithReviews.id,
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

      await authRequest()
        .delete(`/card/${cardWithReviews.id}`)
        .expect(HttpStatus.OK);

      const reviews = await prismaService.cardReview.findMany({
        where: { cardId: cardWithReviews.id },
      });
      expect(reviews).toHaveLength(0);
    });

    it('TC-CARD-061 should return 404 for non-existent card', async () => {
      await authRequest().delete('/card/999999').expect(HttpStatus.NOT_FOUND);
    });

    it('TC-CARD-062 should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/card/${testCard?.id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('TC-CARD-063 should reject deleting already deleted card', async () => {
      const tempCard = await cardService.create({
        deckId: testDeck.id,
        front: 'Double Delete',
        back: 'Double Delete',
      });

      await authRequest().delete(`/card/${tempCard.id}`).expect(HttpStatus.OK);

      await authRequest()
        .delete(`/card/${tempCard.id}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/card/:id/review-status (GET) - Review Status Tests', () => {
    it('TC-CARD-064 should return review status for new card', async () => {
      const res = await authRequest()
        .get(`/card/${testCard?.id}/review-status`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveProperty('nextReviewDate');
      expect(res.body.data).toHaveProperty('lastReviewedAt');
    });

    it('TC-CARD-065 should return null lastReviewedAt for never reviewed card', async () => {
      const newCard = await cardService.create({
        deckId: testDeck.id,
        front: 'Never Reviewed',
        back: 'Never Reviewed',
      });

      const res = await authRequest()
        .get(`/card/${newCard.id}/review-status`)
        .expect(HttpStatus.OK);

      expect(res.body.data.lastReviewedAt).toBeNull();

      await cardService.remove(newCard.id);
    });

    it('TC-CARD-066 should return lastReviewedAt for reviewed card', async () => {
      const reviewedCard = await cardService.create({
        deckId: testDeck.id,
        front: 'Reviewed Card',
        back: 'Reviewed Card',
      });

      await prismaService.cardReview.create({
        data: {
          cardId: reviewedCard.id,
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
        .get(`/card/${reviewedCard.id}/review-status`)
        .expect(HttpStatus.OK);

      expect(res.body.data.lastReviewedAt).toBeDefined();

      await prismaService.cardReview.deleteMany({
        where: { cardId: reviewedCard.id },
      });
      await cardService.remove(reviewedCard.id);
    });

    it('TC-CARD-067 should return 404 for non-existent card', async () => {
      await authRequest()
        .get('/card/999999/review-status')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('TC-CARD-068 should reject without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/card/${testCard?.id}/review-status`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Card Edge Cases', () => {
    it('TC-CARD-069 should handle concurrent card creation', async () => {
      const promises: Promise<request.Response>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          authRequest()
            .post('/card')
            .send({
              deckId: testDeck.id,
              front: `Concurrent ${i}`,
              back: `Concurrent ${i}`,
            }),
        );
      }

      const results = await Promise.all(promises);
      const successCount = results.filter(
        (r) => r.status === HttpStatus.CREATED,
      ).length;
      expect(successCount).toBe(5);

      // Cleanup
      for (const res of results) {
        if (res.status === HttpStatus.CREATED) {
          await cardService.remove(res.body.data.id);
        }
      }
    });

    it('TC-CARD-070 should handle rapid update/delete cycles', async () => {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'Rapid Cycle',
        back: 'Rapid Cycle',
      });

      // Rapid updates
      for (let i = 0; i < 3; i++) {
        await authRequest()
          .patch(`/card/${card.id}`)
          .send({ front: `Update ${i}` });
      }

      // Then delete
      await authRequest().delete(`/card/${card.id}`).expect(HttpStatus.OK);
    });
  });
});
