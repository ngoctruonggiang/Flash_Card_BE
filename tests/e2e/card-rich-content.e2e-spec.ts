/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { Deck } from '@prisma/client';
import { LanguageMode } from 'src/utils/types/dto/deck/createDeck.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Card Rich Content E2E', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;

  const userSignUpDto: SignUpDto = {
    username: 'e2ecardrichuser',
    email: 'e2ecardrichuser@example.com',
    password: 'e2euserpassword',
    confirmPassword: 'e2euserpassword',
  };
  let testUser: AuthResponseDto;
  let testDeck: Deck;
  const createdCardIds: number[] = [];

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

    testUser = await createTestUser(moduleFixture, userSignUpDto);
  });

  beforeEach(async () => {
    testDeck = await deckService.create(testUser.id, {
      title: 'Rich Content Test Deck',
      languageMode: LanguageMode.VN_EN,
    });
  });

  afterEach(async () => {
    // Clean up all created cards
    for (const cardId of createdCardIds) {
      try {
        await cardService.remove(cardId);
      } catch (error) {
        // Card might already be deleted
      }
    }
    createdCardIds.length = 0;

    // Clean up test deck
    if (testDeck) {
      await deckService.remove(testDeck.id);
    }
  });

  afterAll(async () => {
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('Create Card with Rich Content', () => {
    it('should create card with all rich content fields', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'xin chào',
          back: 'hello',
          wordType: 'interjection',
          pronunciation: 'həˈləʊ',
          examples: [
            {
              sentence: 'Hello, how are you?',
              translation: 'Xin chào, bạn khỏe không?',
            },
            {
              sentence: 'Hello everyone!',
              translation: 'Xin chào mọi người!',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.front).toBe('xin chào');
      expect(res.body.data.back).toBe('hello');
      expect(res.body.data.wordType).toBe('interjection');
      expect(res.body.data.pronunciation).toBe('həˈləʊ');
      expect(res.body.data.examples).toHaveLength(2);
      expect(res.body.data.examples[0].sentence).toBe('Hello, how are you?');
      expect(res.body.data.examples[0].translation).toBe(
        'Xin chào, bạn khỏe không?',
      );
      createdCardIds.push(res.body.data.id);
    });

    it('should create card with wordType only', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'ăn',
          back: 'eat',
          wordType: 'verb',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.wordType).toBe('verb');
      expect(res.body.data.pronunciation).toBeNull();
      expect(res.body.data.examples).toBeNull();
      createdCardIds.push(res.body.data.id);
    });

    it('should create card with pronunciation only', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'cảm ơn',
          back: 'thank you',
          pronunciation: '/θæŋk juː/',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.pronunciation).toBe('/θæŋk juː/');
      expect(res.body.data.wordType).toBeNull();
      createdCardIds.push(res.body.data.id);
    });

    it('should create card with examples only', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'tạm biệt',
          back: 'goodbye',
          examples: [
            {
              sentence: 'Goodbye, see you later!',
              translation: 'Tạm biệt, hẹn gặp lại!',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.examples).toHaveLength(1);
      expect(res.body.data.examples[0].sentence).toBe(
        'Goodbye, see you later!',
      );
      createdCardIds.push(res.body.data.id);
    });

    it('should create card without any rich content fields', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'con chó',
          back: 'dog',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.wordType).toBeNull();
      expect(res.body.data.pronunciation).toBeNull();
      expect(res.body.data.examples).toBeNull();
      createdCardIds.push(res.body.data.id);
    });

    it('should reject card with invalid examples format', async () => {
      await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'test',
          back: 'test',
          examples: [
            {
              sentence: 'Missing translation field',
            },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create card with multiple examples', async () => {
      const res = await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'làm',
          back: 'do',
          wordType: 'verb',
          examples: [
            { sentence: 'Do your homework', translation: 'Làm bài tập về nhà' },
            { sentence: 'Do it now', translation: 'Làm ngay đi' },
            { sentence: "Don't do that", translation: 'Đừng làm vậy' },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.examples).toHaveLength(3);
      createdCardIds.push(res.body.data.id);
    });
  });

  describe('Update Card with Rich Content', () => {
    let testCardId: number;

    beforeEach(async () => {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'original',
        back: 'original',
      });
      testCardId = card.id;
      createdCardIds.push(testCardId);
    });

    it('should add rich content to existing card', async () => {
      const res = await authRequest()
        .patch(`/card/${testCardId}`)
        .send({
          wordType: 'noun',
          pronunciation: '/test/',
          examples: [
            {
              sentence: 'Example sentence',
              translation: 'Câu ví dụ',
            },
          ],
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.wordType).toBe('noun');
      expect(res.body.data.pronunciation).toBe('/test/');
      expect(res.body.data.examples).toHaveLength(1);
    });

    it('should update existing rich content', async () => {
      // First add rich content
      await cardService.update(testCardId, {
        wordType: 'verb',
        pronunciation: '/old/',
      });

      // Then update it
      const res = await authRequest()
        .patch(`/card/${testCardId}`)
        .send({
          wordType: 'noun',
          pronunciation: '/new/',
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.wordType).toBe('noun');
      expect(res.body.data.pronunciation).toBe('/new/');
    });

    it('should update examples array', async () => {
      const res = await authRequest()
        .patch(`/card/${testCardId}`)
        .send({
          examples: [
            { sentence: 'New example 1', translation: 'Ví dụ mới 1' },
            { sentence: 'New example 2', translation: 'Ví dụ mới 2' },
          ],
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.examples).toHaveLength(2);
      expect(res.body.data.examples[0].sentence).toBe('New example 1');
    });
  });

  describe('Get Card with Rich Content', () => {
    let richCardId: number;

    beforeEach(async () => {
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'học',
        back: 'learn',
        wordType: 'verb',
        pronunciation: '/lɜːn/',
        examples: [
          { sentence: 'Learn Vietnamese', translation: 'Học tiếng Việt' },
        ],
      });
      richCardId = card.id;
      createdCardIds.push(richCardId);
    });

    it('should return card with parsed examples', async () => {
      const res = await authRequest()
        .get(`/card/${richCardId}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.wordType).toBe('verb');
      expect(res.body.data.pronunciation).toBe('/lɜːn/');
      expect(res.body.data.examples).toBeInstanceOf(Array);
      expect(res.body.data.examples[0]).toHaveProperty('sentence');
      expect(res.body.data.examples[0]).toHaveProperty('translation');
    });

    it('should return all cards with parsed examples', async () => {
      const res = await authRequest()
        .get(`/card?deckId=${testDeck.id}`)
        .expect(HttpStatus.OK);

      const richCard = res.body.data.find((c: any) => c.id === richCardId);
      expect(richCard).toBeDefined();
      expect(richCard.examples).toBeInstanceOf(Array);
      expect(richCard.examples[0].sentence).toBe('Learn Vietnamese');
    });
  });
});
