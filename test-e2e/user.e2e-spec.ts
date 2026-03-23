/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { UpdateUserDto } from 'src/utils/types/dto/user/updateUser.dto';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;

  const testUserLoginDto: SignUpDto = {
    username: 'e2euser',
    email: 'e2euser@example.com',
    password: 'e2euserpassword',
    confirmPassword: 'e2euserpassword',
  };
  let testUser: AuthResponseDto;

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
    testUser = await createTestUser(moduleFixture, testUserLoginDto);
  });

  afterAll(async () => {
    await userService.remove(testUser.id);
    await app.close();
  });

  describe('/user (GET)', () => {
    it('should get current user with valid JWT token', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      const res = await authRequest().get('/user').expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.data.username).toBe(testUserLoginDto.username);
      expect(res.body.data.email).toBe(testUserLoginDto.email);
    });

    it('should throw error with invalid JWT token', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      await request(app.getHttpServer())
        .get('/user')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/user (PATCH)', () => {
    it('should update username', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        username: 'updatedE2EUser',
      };

      const res = await authRequest()
        .patch('/user')
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.data.username).toBe('updatedE2EUser');
    });

    it('should update email', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        email: 'updatedE2EUser@example.com',
      };

      const res = await authRequest()
        .patch('/user')
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.data.email).toBe('updatedE2EUser@example.com');
    });

    it('should update password', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        password: 'updatedE2EPassword',
      };

      await authRequest().patch('/user').send(updateData).expect(HttpStatus.OK);
    });

    it('should update role', async () => {
      if (testUser === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        role: 'ADMIN',
      };

      const res = await authRequest()
        .patch('/user')
        .send(updateData)
        .expect(HttpStatus.OK);

      expect(res.body).toBeDefined();
      expect(res.body.data.role).toBe('ADMIN');
    });
  });
});
