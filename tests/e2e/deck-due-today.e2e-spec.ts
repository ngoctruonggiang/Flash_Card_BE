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
import { ReviewService } from 'src/services/review/review.service';
import { Deck } from '@prisma/client';
import { LanguageMode } from 'src/utils/types/dto/deck/createDeck.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Deck Due Today E2E', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;
  let reviewService: ReviewService;

  const userSignUpDto: SignUpDto = {
    username: 'e2edeckduetodayuser',
    email: 'e2edeckduetodayuser@example.com',
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
    reviewService = moduleFixture.get<ReviewService>(ReviewService);

    testUser = await createTestUser(moduleFixture, userSignUpDto);
  });

  beforeEach(async () => {
    testDeck = await deckService.create(testUser.id, {
      title: 'Deck Due Today Test',
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

  describe('GET /deck/:id/due-today', () => {
    it('should return cards with rich content fields (wordType, pronunciation, examples)', async () => {
      // Create a card with rich content
      const card = await cardService.create({
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
      });
      createdCardIds.push(card.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      const cardData = res.body.data[0];

      // Check all required fields
      expect(cardData.id).toBe(card.id);
      expect(cardData.deckId).toBe(testDeck.id);
      expect(cardData.front).toBe('xin chào');
      expect(cardData.back).toBe('hello');

      // Check rich content fields
      expect(cardData.wordType).toBe('interjection');
      expect(cardData.pronunciation).toBe('həˈləʊ');
      expect(cardData.examples).toHaveLength(2);
      expect(cardData.examples[0]).toEqual({
        sentence: 'Hello, how are you?',
        translation: 'Xin chào, bạn khỏe không?',
      });
      expect(cardData.examples[1]).toEqual({
        sentence: 'Hello everyone!',
        translation: 'Xin chào mọi người!',
      });

      // Check other fields
      expect(cardData.tags).toBeNull();
      expect(cardData.nextReviewDate).toBeNull();
      expect(cardData.createdAt).toBeDefined();
      expect(cardData.updatedAt).toBeDefined();
    });

    it('should return cards with null rich content fields when not provided', async () => {
      // Create a card without rich content
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'What is 2+2?',
        back: '4',
        tags: 'math,basics',
      });
      createdCardIds.push(card.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      const cardData = res.body.data[0];

      expect(cardData.id).toBe(card.id);
      expect(cardData.front).toBe('What is 2+2?');
      expect(cardData.back).toBe('4');
      expect(cardData.tags).toBe('math,basics');

      // Check that rich content fields are null
      expect(cardData.wordType).toBeNull();
      expect(cardData.pronunciation).toBeNull();
      expect(cardData.examples).toBeNull();
    });

    it('should return cards with partial rich content fields', async () => {
      // Create a card with only wordType
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'ăn',
        back: 'eat',
        wordType: 'verb',
      });
      createdCardIds.push(card.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      const cardData = res.body.data[0];

      expect(cardData.front).toBe('ăn');
      expect(cardData.back).toBe('eat');
      expect(cardData.wordType).toBe('verb');
      expect(cardData.pronunciation).toBeNull();
      expect(cardData.examples).toBeNull();
    });

    it('should return multiple cards with mixed rich content', async () => {
      // Create multiple cards with different rich content
      const card1 = await cardService.create({
        deckId: testDeck.id,
        front: 'cảm ơn',
        back: 'thank you',
        wordType: 'phrase',
        pronunciation: 'θæŋk juː',
        examples: [
          {
            sentence: 'Thank you very much!',
            translation: 'Cảm ơn rất nhiều!',
          },
        ],
      });
      createdCardIds.push(card1.id);

      const card2 = await cardService.create({
        deckId: testDeck.id,
        front: 'đẹp',
        back: 'beautiful',
        wordType: 'adjective',
      });
      createdCardIds.push(card2.id);

      const card3 = await cardService.create({
        deckId: testDeck.id,
        front: 'What is the capital?',
        back: 'Hanoi',
      });
      createdCardIds.push(card3.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(3);

      // Check first card with full rich content
      const firstCard = res.body.data.find((c: any) => c.id === card1.id);
      expect(firstCard.wordType).toBe('phrase');
      expect(firstCard.pronunciation).toBe('θæŋk juː');
      expect(firstCard.examples).toHaveLength(1);

      // Check second card with partial rich content
      const secondCard = res.body.data.find((c: any) => c.id === card2.id);
      expect(secondCard.wordType).toBe('adjective');
      expect(secondCard.pronunciation).toBeNull();
      expect(secondCard.examples).toBeNull();

      // Check third card with no rich content
      const thirdCard = res.body.data.find((c: any) => c.id === card3.id);
      expect(thirdCard.wordType).toBeNull();
      expect(thirdCard.pronunciation).toBeNull();
      expect(thirdCard.examples).toBeNull();
    });

    it('should return empty array when no cards are due', async () => {
      // Create a card and mark it as reviewed with future review date
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'test',
        back: 'test',
      });
      createdCardIds.push(card.id);

      // Submit a review to set next review date to future
      await reviewService.submitReviews({
        CardReviews: [
          {
            cardId: card.id,
            quality: 'Easy',
          },
        ],
        reviewedAt: new Date(),
      });

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      // Should return empty since the card is not due today
      expect(res.body.data).toHaveLength(0);
    });

    it('should include cards that have never been reviewed', async () => {
      // Create cards, some never reviewed
      const card1 = await cardService.create({
        deckId: testDeck.id,
        front: 'never reviewed',
        back: 'answer',
        wordType: 'noun',
      });
      createdCardIds.push(card1.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nextReviewDate).toBeNull();
      expect(res.body.data[0].wordType).toBe('noun');
    });

    it('should properly parse examples field as array of objects', async () => {
      // Create card with multiple examples
      const card = await cardService.create({
        deckId: testDeck.id,
        front: 'đi',
        back: 'go',
        examples: [
          {
            sentence: "Let's go!",
            translation: 'Đi thôi!',
          },
          {
            sentence: 'Where are you going?',
            translation: 'Bạn đi đâu?',
          },
          {
            sentence: 'I go to school.',
            translation: 'Tôi đi học.',
          },
        ],
      });
      createdCardIds.push(card.id);

      const res = await authRequest()
        .get(`/deck/${testDeck.id}/due-today`)
        .expect(HttpStatus.OK);

      expect(res.body.data).toHaveLength(1);
      const cardData = res.body.data[0];

      // Verify examples is an array
      expect(Array.isArray(cardData.examples)).toBe(true);
      expect(cardData.examples).toHaveLength(3);

      // Verify each example is an object with sentence and translation
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      cardData.examples.forEach((example: any) => {
        expect(example).toHaveProperty('sentence');
        expect(example).toHaveProperty('translation');
        expect(typeof example.sentence).toBe('string');
        expect(typeof example.translation).toBe('string');
      });
    });
  });
});
