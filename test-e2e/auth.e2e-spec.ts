/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;

  const testUserLoginDto: SignUpDto = {
    username: 'e2eauth',
    email: 'e2eauth@example.com',
    password: 'e2eauthpassword',
    confirmPassword: 'e2eauthpassword',
  };
  let testUser: AuthResponseDto;

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
    testUser = await createTestUser(moduleFixture, testUserLoginDto);
  });

  afterAll(async () => {
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should sign up a new user', async () => {
      // Remove the user if it already exists
      {
        const user = await userService.findByUsername('signUpTest');
        if (user) {
          await userService.remove(user.id);
        }
      }

      const createUserDto = {
        username: 'signUpTest',
        email: 'signUpTest@example.com',
        password: 'e2eauthpassword',
        confirmPassword: 'e2eauthpassword',
      };
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      expect(res.body).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.username).toBe(createUserDto.username);
      expect(res.body.data.email).toBe(createUserDto.email);

      const user = await userService.findByEmail(createUserDto.email);
      expect(user).toBeDefined();
      expect(user).not.toBeNull();
      expect(user!.username).toBe(createUserDto.username);
      expect(user!.email).toBe(createUserDto.email);

      await userService.remove(user!.id);
    });

    it('should handle sign up username conflict', async () => {
      const createUserDto = {
        username: testUserLoginDto.username,
        email: 'signUpTest@example.com',
        password: 'e2eauthpassword',
        confirmPassword: 'e2eauthpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should handle sign up email conflict', async () => {
      const createUserDto = {
        username: 'signUpTest',
        email: testUserLoginDto.email,
        password: 'e2eauthpassword',
        confirmPassword: 'e2eauthpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should sign in a user and return JWT token', async () => {
      const loginUserDto = {
        email: testUserLoginDto.email,
        password: testUserLoginDto.password,
      };
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginUserDto)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.username).toBe(testUserLoginDto.username);
      expect(res.body.data.email).toBe(testUserLoginDto.email);

      const user = await userService.findByUsername(testUserLoginDto.username);
      expect(user).not.toBeNull();
      expect(user!.username).toBe(testUserLoginDto.username);
    });

    it('should handle sign in wrong password', async () => {
      const signInDto = {
        email: testUserLoginDto.email,
        password: 'wrongpassword',
      };
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(signInDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid email or password');
        });
    });

    it('should handle sign in non-existent user', async () => {
      const signInDto = {
        email: 'wrongemail@example.com',
        password: 'wrongpassword',
      };
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(signInDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid email or password');
        });
    });
  });
});
