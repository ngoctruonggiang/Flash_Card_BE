/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { CardService } from 'src/services/card/card.service';
import { DeckService } from 'src/services/deck/deck.service';
import { Deck } from '@prisma/client';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Bidirectional Card Creation (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let cardService: CardService;
  let deckService: DeckService;

  const userSignUpDto: SignUpDto = {
    username: 'e2ebidiruser',
    email: 'e2ebidiruser@example.com',
    password: 'e2euserpassword',
    confirmPassword: 'e2euserpassword',
  };
  let testUser: AuthResponseDto;
  let bidirectionalDeck: Deck;
  let vnEnDeck: Deck;
  let enVnDeck: Deck;

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

    // Create test decks with different language modes
    bidirectionalDeck = await deckService.create(testUser.id, {
      title: 'Bidirectional Deck',
      languageMode: 'BIDIRECTIONAL',
    });

    vnEnDeck = await deckService.create(testUser.id, {
      title: 'VN to EN Deck',
      languageMode: 'VN_EN',
    });

    enVnDeck = await deckService.create(testUser.id, {
      title: 'EN to VN Deck',
      languageMode: 'EN_VN',
    });
  });

  afterAll(async () => {
    // Clean up decks (cards will be cascade deleted)
    await deckService.remove(bidirectionalDeck.id);
    await deckService.remove(vnEnDeck.id);
    await deckService.remove(enVnDeck.id);
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('Bidirectional Card Creation', () => {
    it('should create two cards for BIDIRECTIONAL deck', async () => {
      // Create a card in bidirectional deck
      const createRes = await authRequest()
        .post('/card')
        .send({
          deckId: bidirectionalDeck.id,
          front: 'xin chào',
          back: 'hello',
          wordType: 'greeting',
          pronunciation: '/həˈləʊ/',
          examples: [
            {
              sentence: 'Hello, friend!',
              translation: 'Xin chào, bạn!',
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      const primaryCardId = createRes.body.data.id;

      // Verify primary card has rich content
      expect(createRes.body.data.front).toBe('xin chào');
      expect(createRes.body.data.back).toBe('hello');
      expect(createRes.body.data.wordType).toBe('greeting');
      expect(createRes.body.data.pronunciation).toBe('/həˈləʊ/');
      expect(createRes.body.data.examples).toHaveLength(1);

      // Get all cards from the deck
      const allCardsRes = await authRequest()
        .get(`/card?deckId=${bidirectionalDeck.id}`)
        .expect(HttpStatus.OK);

      // Should have exactly 2 cards
      expect(allCardsRes.body.data).toHaveLength(2);

      // Find the primary and reverse cards
      const primaryCard = allCardsRes.body.data.find(
        (c: any) => c.id === primaryCardId,
      );
      const reverseCard = allCardsRes.body.data.find(
        (c: any) => c.id !== primaryCardId,
      );

      // Verify primary card
      expect(primaryCard).toBeDefined();
      expect(primaryCard.front).toBe('xin chào');
      expect(primaryCard.back).toBe('hello');
      expect(primaryCard.wordType).toBe('greeting');
      expect(primaryCard.pronunciation).toBe('/həˈləʊ/');
      expect(primaryCard.examples).toHaveLength(1);

      // Verify reverse card (swapped front/back, no rich content)
      expect(reverseCard).toBeDefined();
      expect(reverseCard.front).toBe('hello'); // Swapped
      expect(reverseCard.back).toBe('xin chào'); // Swapped
      // Reverse card now duplicates rich content fields
      expect(reverseCard.wordType).toBe('greeting');
      expect(reverseCard.pronunciation).toBe('/həˈləʊ/');
      expect(reverseCard.examples).toHaveLength(1);
    });

    it('should create two cards with simple content', async () => {
      await authRequest()
        .post('/card')
        .send({
          deckId: bidirectionalDeck.id,
          front: 'cảm ơn',
          back: 'thank you',
        })
        .expect(HttpStatus.CREATED);

      const allCardsRes = await authRequest()
        .get(`/card?deckId=${bidirectionalDeck.id}`)
        .expect(HttpStatus.OK);

      // Find the newly created cards (skip the ones from previous test)
      const newCards = allCardsRes.body.data.filter(
        (c: any) => c.front === 'cảm ơn' || c.front === 'thank you',
      );

      expect(newCards).toHaveLength(2);

      const vnEnCard = newCards.find((c: any) => c.front === 'cảm ơn');
      const enVnCard = newCards.find((c: any) => c.front === 'thank you');

      expect(vnEnCard.back).toBe('thank you');
      expect(enVnCard.back).toBe('cảm ơn');
    });

    it('should create only one card for VN_EN deck', async () => {
      const beforeCount = await cardService.findByDeck(vnEnDeck.id);

      await authRequest()
        .post('/card')
        .send({
          deckId: vnEnDeck.id,
          front: 'xin lỗi',
          back: 'sorry',
        })
        .expect(HttpStatus.CREATED);

      const afterCards = await cardService.findByDeck(vnEnDeck.id);
      expect(afterCards.length).toBe(beforeCount.length + 1);
    });

    it('should create only one card for EN_VN deck', async () => {
      const beforeCount = await cardService.findByDeck(enVnDeck.id);

      await authRequest()
        .post('/card')
        .send({
          deckId: enVnDeck.id,
          front: 'goodbye',
          back: 'tạm biệt',
        })
        .expect(HttpStatus.CREATED);

      const afterCards = await cardService.findByDeck(enVnDeck.id);
      expect(afterCards.length).toBe(beforeCount.length + 1);
    });
  });

  describe('Bidirectional with Tags', () => {
    it('should preserve tags in both cards', async () => {
      const createRes = await authRequest()
        .post('/card')
        .send({
          deckId: bidirectionalDeck.id,
          front: 'buổi sáng',
          back: 'morning',
          tags: 'time,greetings',
        })
        .expect(HttpStatus.CREATED);

      const primaryCardId = createRes.body.data.id;

      const allCardsRes = await authRequest()
        .get(`/card?deckId=${bidirectionalDeck.id}`)
        .expect(HttpStatus.OK);

      const primaryCard = allCardsRes.body.data.find(
        (c: any) => c.id === primaryCardId,
      );
      const reverseCard = allCardsRes.body.data.find(
        (c: any) => c.id !== primaryCardId && c.front === 'morning',
      );

      expect(primaryCard.tags).toBe('time,greetings');
      expect(reverseCard.tags).toBe('time,greetings');
    });
  });

  describe('Update Does Not Create Reverse Card', () => {
    it('should not create reverse card when updating existing card', async () => {
      // First change deck to bidirectional
      await deckService.update(vnEnDeck.id, {
        languageMode: 'BIDIRECTIONAL',
      });

      // Create a card before the mode change
      const createRes = await authRequest()
        .post('/card')
        .send({
          deckId: vnEnDeck.id,
          front: 'original front',
          back: 'original back',
        })
        .expect(HttpStatus.CREATED);

      const cardId = createRes.body.data.id;

      // Count cards before update
      const beforeUpdate = await cardService.findByDeck(vnEnDeck.id);
      const countBefore = beforeUpdate.length;

      // Update the card
      await authRequest()
        .patch(`/card/${cardId}`)
        .send({
          front: 'updated front',
          back: 'updated back',
        })
        .expect(HttpStatus.OK);

      // Count cards after update - should be the same
      const afterUpdate = await cardService.findByDeck(vnEnDeck.id);
      const countAfter = afterUpdate.length;

      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Deck Language Mode Change', () => {
    let testDeck: Deck;

    beforeEach(async () => {
      testDeck = await deckService.create(testUser.id, {
        title: 'Mode Change Test Deck',
        languageMode: 'VN_EN',
      });
    });

    afterEach(async () => {
      await deckService.remove(testDeck.id);
    });

    it('should only affect new cards after mode change', async () => {
      // Create card before mode change
      await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'before change',
          back: 'trước khi thay đổi',
        })
        .expect(HttpStatus.CREATED);

      const beforeCards = await cardService.findByDeck(testDeck.id);
      expect(beforeCards.length).toBe(1);

      // Change to BIDIRECTIONAL
      await deckService.update(testDeck.id, {
        languageMode: 'BIDIRECTIONAL',
      });

      // Create card after mode change
      await authRequest()
        .post('/card')
        .send({
          deckId: testDeck.id,
          front: 'after change',
          back: 'sau khi thay đổi',
        })
        .expect(HttpStatus.CREATED);

      // Should now have 3 cards (1 before + 2 after with bidirectional)
      const afterCards = await cardService.findByDeck(testDeck.id);
      expect(afterCards.length).toBe(3);
    });
  });
});
