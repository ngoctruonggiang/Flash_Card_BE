/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { DeckService } from 'src/services/deck/deck.service';
import { Deck, CardStatus } from '@prisma/client';
import { LanguageMode } from 'src/utils/types/dto/deck/createDeck.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('Deck Customization E2E', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;

  const userSignUpDto: SignUpDto = {
    username: 'e2edeckcustomuser',
    email: 'e2edeckcustomuser@example.com',
    password: 'e2euserpassword',
    confirmPassword: 'e2euserpassword',
  };
  let testUser: AuthResponseDto;
  const createdDeckIds: number[] = [];

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

    testUser = await createTestUser(moduleFixture, userSignUpDto);
  });

  afterEach(async () => {
    // Clean up all created decks
    for (const deckId of createdDeckIds) {
      try {
        await deckService.remove(deckId);
      } catch (error) {
        // Deck might already be deleted
      }
    }
    createdDeckIds.length = 0;
  });

  afterAll(async () => {
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('Create Deck with Customization', () => {
    it('should create deck with iconName and colorCode', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'Vietnamese Basics',
          description: 'Essential Vietnamese phrases',
          iconName: 'flag-vietnam',
          colorCode: '#DA251D',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('Vietnamese Basics');
      expect(res.body.data.iconName).toBe('flag-vietnam');
      expect(res.body.data.colorCode).toBe('#DA251D');
      expect(res.body.data.languageMode).toBe('VN_EN'); // Default
      createdDeckIds.push(res.body.data.id);
    });

    it('should create deck with VN_EN language mode', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'VN to EN Deck',
          languageMode: 'VN_EN',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.languageMode).toBe('VN_EN');
      createdDeckIds.push(res.body.data.id);
    });

    it('should create deck with EN_VN language mode', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'EN to VN Deck',
          languageMode: 'EN_VN',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.languageMode).toBe('EN_VN');
      createdDeckIds.push(res.body.data.id);
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
      createdDeckIds.push(res.body.data.id);
    });

    it('should create deck with full hex color code', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'Color Test',
          colorCode: '#4CAF50',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.colorCode).toBe('#4CAF50');
      createdDeckIds.push(res.body.data.id);
    });

    it('should create deck with short hex color code', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'Color Test Short',
          colorCode: '#F00',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.colorCode).toBe('#F00');
      createdDeckIds.push(res.body.data.id);
    });

    it('should reject invalid hex color code', async () => {
      await authRequest()
        .post('/deck')
        .send({
          title: 'Invalid Color',
          colorCode: 'red',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject invalid hex color format', async () => {
      await authRequest()
        .post('/deck')
        .send({
          title: 'Invalid Color Format',
          colorCode: '#GGGGGG',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject invalid language mode', async () => {
      await authRequest()
        .post('/deck')
        .send({
          title: 'Invalid Mode',
          languageMode: 'INVALID_MODE',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should create deck with all optional fields null', async () => {
      const res = await authRequest()
        .post('/deck')
        .send({
          title: 'Minimal Deck',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.data.iconName).toBeNull();
      expect(res.body.data.colorCode).toBeNull();
      expect(res.body.data.languageMode).toBe('VN_EN');
      createdDeckIds.push(res.body.data.id);
    });
  });

  describe('Update Deck Customization', () => {
    let testDeckId: number;

    beforeEach(async () => {
      const deck = await deckService.create(testUser.id, {
        title: 'Original Deck',
        description: 'Original description',
      });
      testDeckId = deck.id;
      createdDeckIds.push(testDeckId);
    });

    it('should update deck icon and color', async () => {
      const res = await authRequest()
        .patch(`/deck/${testDeckId}`)
        .send({
          iconName: 'book',
          colorCode: '#2196F3',
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.iconName).toBe('book');
      expect(res.body.data.colorCode).toBe('#2196F3');
      expect(res.body.data.title).toBe('Original Deck');
    });

    it('should update language mode', async () => {
      const res = await authRequest()
        .patch(`/deck/${testDeckId}`)
        .send({
          languageMode: 'BIDIRECTIONAL',
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.languageMode).toBe('BIDIRECTIONAL');
    });

    it('should update multiple fields at once', async () => {
      const res = await authRequest()
        .patch(`/deck/${testDeckId}`)
        .send({
          title: 'Updated Title',
          iconName: 'star',
          colorCode: '#FFC107',
          languageMode: 'EN_VN',
        })
        .expect(HttpStatus.OK);

      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.iconName).toBe('star');
      expect(res.body.data.colorCode).toBe('#FFC107');
      expect(res.body.data.languageMode).toBe('EN_VN');
    });

    it('should reject invalid color code on update', async () => {
      await authRequest()
        .patch(`/deck/${testDeckId}`)
        .send({
          colorCode: 'invalid',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('Get Deck with Customization', () => {
    let customDeckId: number;

    beforeEach(async () => {
      const deck = await deckService.create(testUser.id, {
        title: 'Custom Deck',
        iconName: 'heart',
        colorCode: '#E91E63',
        languageMode: LanguageMode.BIDIRECTIONAL,
      });
      customDeckId = deck.id;
      createdDeckIds.push(customDeckId);
    });

    it('should return deck with all customization fields', async () => {
      const res = await authRequest()
        .get(`/deck/${customDeckId}`)
        .expect(HttpStatus.OK);

      expect(res.body.data.iconName).toBe('heart');
      expect(res.body.data.colorCode).toBe('#E91E63');
      expect(res.body.data.languageMode).toBe('BIDIRECTIONAL');
    });

    it('should return all decks with customization in list', async () => {
      const res = await authRequest().get('/deck').expect(HttpStatus.OK);

      const customDeck = res.body.data.find((d: any) => d.id === customDeckId);
      expect(customDeck).toBeDefined();
      expect(customDeck.iconName).toBe('heart');
      expect(customDeck.colorCode).toBe('#E91E63');
      expect(customDeck.languageMode).toBe('BIDIRECTIONAL');
    });
  });

  describe('I - Vietnamese Front, English Back Deck with All Fields', () => {
    it('should create VN_EN deck with all fields filled, retrieve it, and verify all fields', async () => {
      // Step 1: Create Vietnamese Front, English Back deck with all fields filled
      const deckData = {
        title: 'Basic Vietnamese',
        description: 'Essential Vietnamese phrases for beginners',
        iconName: 'flag-vietnam',
        colorCode: '#DA251D',
        languageMode: 'VN_EN',
      };

      const createRes = await authRequest()
        .post('/deck')
        .send(deckData)
        .expect(HttpStatus.CREATED);

      expect(createRes.body.data).toBeDefined();
      expect(createRes.body.data.id).toBeDefined();
      const createdDeckId = createRes.body.data.id as number;
      createdDeckIds.push(createdDeckId);

      // Verify creation response contains all fields
      expect(createRes.body.data.title).toBe(deckData.title);
      expect(createRes.body.data.description).toBe(deckData.description);
      expect(createRes.body.data.iconName).toBe(deckData.iconName);
      expect(createRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(createRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(createRes.body.data.userId).toBe(testUser.id);
      expect(createRes.body.data.createdAt).toBeDefined();
      expect(createRes.body.data.updatedAt).toBeDefined();

      // Step 2: Get the deck created in step 1 via API
      const getRes = await authRequest()
        .get(`/deck/${createdDeckId}`)
        .expect(HttpStatus.OK);

      // Step 3: Verify all fields are in response
      expect(getRes.body.data).toBeDefined();
      expect(getRes.body.data.id).toBe(createdDeckId);
      expect(getRes.body.data.title).toBe(deckData.title);
      expect(getRes.body.data.description).toBe(deckData.description);
      expect(getRes.body.data.iconName).toBe(deckData.iconName);
      expect(getRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(getRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(getRes.body.data.userId).toBe(testUser.id);
      expect(getRes.body.data.createdAt).toBeDefined();
      expect(getRes.body.data.updatedAt).toBeDefined();
      expect(getRes.body.data.user).toBeDefined();
      expect(getRes.body.data.user.id).toBe(testUser.id);
      expect(getRes.body.data.cards).toBeDefined();
      expect(Array.isArray(getRes.body.data.cards)).toBe(true);
    });
  });

  describe('II - English Front, Vietnamese Back Deck with All Fields', () => {
    it('should create EN_VN deck with all fields filled, retrieve it, and verify all fields', async () => {
      // Step 1: Create English Front, Vietnamese Back deck with all fields filled
      const deckData = {
        title: 'English to Vietnamese',
        description: 'Learn Vietnamese from English phrases',
        iconName: 'book',
        colorCode: '#4CAF50',
        languageMode: 'EN_VN',
      };

      const createRes = await authRequest()
        .post('/deck')
        .send(deckData)
        .expect(HttpStatus.CREATED);

      expect(createRes.body.data).toBeDefined();
      expect(createRes.body.data.id).toBeDefined();
      const createdDeckId = createRes.body.data.id as number;
      createdDeckIds.push(createdDeckId);

      // Verify creation response contains all fields
      expect(createRes.body.data.title).toBe(deckData.title);
      expect(createRes.body.data.description).toBe(deckData.description);
      expect(createRes.body.data.iconName).toBe(deckData.iconName);
      expect(createRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(createRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(createRes.body.data.userId).toBe(testUser.id);
      expect(createRes.body.data.createdAt).toBeDefined();
      expect(createRes.body.data.updatedAt).toBeDefined();

      // Step 2: Get the deck created in step 1 via API
      const getRes = await authRequest()
        .get(`/deck/${createdDeckId}`)
        .expect(HttpStatus.OK);

      // Step 3: Verify all fields are in response
      expect(getRes.body.data).toBeDefined();
      expect(getRes.body.data.id).toBe(createdDeckId);
      expect(getRes.body.data.title).toBe(deckData.title);
      expect(getRes.body.data.description).toBe(deckData.description);
      expect(getRes.body.data.iconName).toBe(deckData.iconName);
      expect(getRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(getRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(getRes.body.data.userId).toBe(testUser.id);
      expect(getRes.body.data.createdAt).toBeDefined();
      expect(getRes.body.data.updatedAt).toBeDefined();
      expect(getRes.body.data.user).toBeDefined();
      expect(getRes.body.data.user.id).toBe(testUser.id);
      expect(getRes.body.data.cards).toBeDefined();
      expect(Array.isArray(getRes.body.data.cards)).toBe(true);
    });
  });

  describe('III - Bidirectional Deck with All Fields', () => {
    it('should create BIDIRECTIONAL deck with all fields filled, retrieve it, and verify all fields', async () => {
      // Step 1: Create BIDIRECTIONAL deck with all fields filled
      const deckData = {
        title: 'Bidirectional Language Learning',
        description:
          'Practice both Vietnamese to English and English to Vietnamese',
        iconName: 'star',
        colorCode: '#FF9800',
        languageMode: 'BIDIRECTIONAL',
      };

      const createRes = await authRequest()
        .post('/deck')
        .send(deckData)
        .expect(HttpStatus.CREATED);

      expect(createRes.body.data).toBeDefined();
      expect(createRes.body.data.id).toBeDefined();
      const createdDeckId = createRes.body.data.id as number;
      createdDeckIds.push(createdDeckId);

      // Verify creation response contains all fields
      expect(createRes.body.data.title).toBe(deckData.title);
      expect(createRes.body.data.description).toBe(deckData.description);
      expect(createRes.body.data.iconName).toBe(deckData.iconName);
      expect(createRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(createRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(createRes.body.data.userId).toBe(testUser.id);
      expect(createRes.body.data.createdAt).toBeDefined();
      expect(createRes.body.data.updatedAt).toBeDefined();

      // Step 2: Get the deck created in step 1 via API
      const getRes = await authRequest()
        .get(`/deck/${createdDeckId}`)
        .expect(HttpStatus.OK);

      // Step 3: Verify all fields are in response
      expect(getRes.body.data).toBeDefined();
      expect(getRes.body.data.id).toBe(createdDeckId);
      expect(getRes.body.data.title).toBe(deckData.title);
      expect(getRes.body.data.description).toBe(deckData.description);
      expect(getRes.body.data.iconName).toBe(deckData.iconName);
      expect(getRes.body.data.colorCode).toBe(deckData.colorCode);
      expect(getRes.body.data.languageMode).toBe(deckData.languageMode);
      expect(getRes.body.data.userId).toBe(testUser.id);
      expect(getRes.body.data.createdAt).toBeDefined();
      expect(getRes.body.data.updatedAt).toBeDefined();
      expect(getRes.body.data.user).toBeDefined();
      expect(getRes.body.data.user.id).toBe(testUser.id);
      expect(getRes.body.data.cards).toBeDefined();
      expect(Array.isArray(getRes.body.data.cards)).toBe(true);
    });
  });
});
