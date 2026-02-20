/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { AuthService } from 'src/services/auth/auth.service';
import { ApiResponseDto } from 'src/utils/api-response.dto';
import { JwtTokenReturn } from 'src/utils/types/JWTTypes';
import { UpdateUserDto } from 'src/utils/types/dto/user/updateUser.dto';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let authService: AuthService;

  const testUserLoginDto = {
    username: 'e2euser',
    email: 'e2euser@example.com',
    password: 'e2euserpassword',
  };
  let testUserId: number;
  let jwtToken: JwtTokenReturn | null = null;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    authService = moduleFixture.get<AuthService>(AuthService);

    const existingUser = await userService.findByEmail(testUserLoginDto.email);
    if (!existingUser) {
      jwtToken = await authService.signUp(testUserLoginDto);
    } else {
      jwtToken = await authService.signIn({
        username: testUserLoginDto.username,
        password: testUserLoginDto.password,
      });
    }
    testUserId = (await userService.findByEmail(testUserLoginDto.email))!.id;
  });

  afterEach(async () => {
    await userService.remove(testUserId);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/user/signup (POST)', () => {
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

      await userService.remove(user!.id);
    });

    it('should handle sign up username conflict', async () => {
      const createUserDto = {
        username: testUserLoginDto.username,
        email: 'signUpTest@example.com',
        password: 'e2euserpassword',
      };

      await request(app.getHttpServer())
        .post('/user/signup')
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);
    });

    it('should handle sign up email conflict', async () => {
      const createUserDto = {
        username: 'signUpTest',
        email: testUserLoginDto.email,
        password: 'e2euserpassword',
      };

      await request(app.getHttpServer())
        .post('/user/signup')
        .send(createUserDto)
        .expect(HttpStatus.CONFLICT);
    });
  });

  describe('/user/signin (POST)', () => {
    it('should sign in a user and return JWT token', async () => {
      const loginUserDto = {
        username: testUserLoginDto.username,
        password: testUserLoginDto.password,
      };
      await request(app.getHttpServer())
        .post('/user/signin')
        .send(loginUserDto)
        .expect(HttpStatus.OK);

      const user = await userService.findByUsername(loginUserDto.username);
      expect(user).not.toBeNull();
      expect(user!.username).toBe(loginUserDto.username);
    });

    it('should handle sign in wrong password', async () => {
      const signInDto = {
        username: testUserLoginDto.username,
        password: 'wrongpassword',
      };
      await request(app.getHttpServer())
        .post('/user/signin')
        .send(signInDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid username or password');
        });
    });

    it('should handle sign in non-existent user', async () => {
      const signInDto = {
        username: 'wrongusername',
        password: 'wrongpassword',
      };
      await request(app.getHttpServer())
        .post('/user/signin')
        .send(signInDto)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid username or password');
        });
    });
  });

  describe('/user (GET)', () => {
    it('should get current user with valid JWT token', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should throw error with invalid JWT token', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer invalid_token`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/user (PATCH)', () => {
    it('should update username', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        username: 'updatedE2EUser',
      };

      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);
    });

    it('should update email', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        email: 'updatedE2EUser@example.com',
      };

      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);
    });

    it('should update password', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        password: 'updatedE2EPassword',
      };

      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);
    });

    it('should update role', async () => {
      if (jwtToken === null) {
        throw new Error('JWT token is null');
      }
      const updateData: UpdateUserDto = {
        role: 'ADMIN',
      };

      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${jwtToken?.accessToken}`)
        .send(updateData)
        .expect(HttpStatus.OK);
    });
  });
});
