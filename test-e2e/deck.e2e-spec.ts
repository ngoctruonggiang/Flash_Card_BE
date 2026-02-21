/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { CardService } from 'src/services/card/card.service';
import { Deck, User } from '@prisma/client';
import { DeckService } from 'src/services/deck/deck.service';
import { title } from 'process';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;

  const userSignUpDto = {
    username: 'e2edeckuser',
    email: 'e2edeckuser@example.com',
    password: 'e2euserpassword',
  };
  let testDeck: Deck | null;
  let userId: number;
  let jwtToken: JwtTokenReturn | null = null;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true, // Automatically transform incoming data to DTO instances
        whitelist: true, // Remove properties not defined in the DTO
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      }),
    );
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    deckService = moduleFixture.get<DeckService>(DeckService);

    const authService = moduleFixture.get<AuthService>(AuthService);
    const existingUser = await userService.findByEmail(userSignUpDto.email);
    if (!existingUser) {
      jwtToken = await authService.signUp(userSignUpDto);
    } else {
      jwtToken = await authService.signIn({
        username: userSignUpDto.username,
        password: userSignUpDto.password,
      });
    }
    userId = (await userService.findByEmail(userSignUpDto.email))!.id;

    testDeck = await deckService.create(userId, {
      title: 'Test Deck',
      description: 'This is a test deck',
    });
  });

  afterAll(async () => {
    const user = await userService.findByEmail(userSignUpDto.email);
    if (user) {
      await userService.remove(user.id);
    }

    await app.close();
  });

  afterEach(async () => {
    if (testDeck) await deckService.remove(testDeck.id);
  });

  it('/deck (POST) create Deck', async () => {
    const res = await request(app.getHttpServer())
      .post('/deck')
      .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
      .send({
        title: 'Test Deck',
        description: 'This is a test deck',
      })
      .expect(201);

    // Clean up - delete the created deck
    const createdDeckId = res.body.data.id;
    await deckService.remove(createdDeckId);
  });

  it('/deck/:id (GET) ', async () => {
    const res = await request(app.getHttpServer())
      .get(`/deck/${testDeck?.id}`)
      .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
      .expect(200);

    // Clean up - delete the created deck
    const getDeck = res.body.data;
    expect(getDeck.id).toBe(testDeck?.id);
  });

  it('/deck/:id (PATCH) ', async () => {
    await request(app.getHttpServer())
      .patch(`/deck/${testDeck?.id}`)
      .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
      .send({
        title: 'Updated Test Deck',
      })
      .expect(200);
  });

  it('/deck/:id (DELETE) ', async () => {
    await request(app.getHttpServer())
      .delete(`/deck/${testDeck?.id}`)
      .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
      .expect(200);
    testDeck = null;
  });
});
