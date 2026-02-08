import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { PrismaService } from 'src/services/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a user', async () => {
    const createUserDto = {
      username: 'e2euser',
      email: 'e2euser@example.com',
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
