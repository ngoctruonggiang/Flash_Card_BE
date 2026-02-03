import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserService } from 'src/services/user/user.service';
import { PrismaService } from 'src/services/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userService = moduleFixture.get<UserService>(UserService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
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
      .post('/user')
      .send(createUserDto)
      .expect(201);

    const user = await userService.findByEmail(createUserDto.email);
    expect(user).toBeDefined();
    expect(user).not.toBeNull();
    expect(user!.username).toBe(createUserDto.username);
    expect(user!.email).toBe(createUserDto.email);
  });
});
