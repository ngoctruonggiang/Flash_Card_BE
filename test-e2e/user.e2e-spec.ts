import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let authService: AuthService;

  const testUser = {
    username: 'e2euser',
    email: 'e2euser@example.com',
    password: 'e2euserpassword',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    authService = moduleFixture.get<AuthService>(AuthService);

    const existingUser = await userService.findByEmail(testUser.email);
    if (!existingUser) {
      await authService.signUp(testUser);
    }
  });

  afterAll(async () => {
    const user = await userService.findByEmail(testUser.email);
    if (user) {
      await userService.remove(user.id);
    }

    await app.close();
  });

  describe('/user/signup (POST)', () => {
    it('should sign up a new user', async () => {
      const createUserDto = {
        username: 'signUpTest',
        email: 'signUpTest@example.com',
        password: 'e2euserpassword',
      };
      await request(app.getHttpServer())
        .post('/user/signup')
        .send(createUserDto)
        .expect(HttpStatus.CREATED);

      const user = await userService.findByEmail(createUserDto.email);
      expect(user).toBeDefined();
      expect(user).not.toBeNull();
      expect(user!.username).toBe(createUserDto.username);
      expect(user!.email).toBe(createUserDto.email);
    });
  });

  describe('/user/signin (POST)', () => {
    it('should sign in an existing user', async () => {
      const loginUserDto = {
        username: testUser.username,
        password: testUser.password,
      };
      await request(app.getHttpServer())
        .post('/user/signin')
        .send(loginUserDto)
        .expect(HttpStatus.OK);

      const user = await userService.findByUsername(loginUserDto.username);
      expect(user).not.toBeNull();
      expect(user!.username).toBe(loginUserDto.username);
    });
  });
});
