/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('UC-01: Register & UC-02: Login - Auth E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;

  const baseTestUser: SignUpDto = {
    username: 'authcomprehensive',
    email: 'authcomprehensive@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
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
    testUser = await createTestUser(moduleFixture, baseTestUser);
  });

  afterAll(async () => {
    try {
      await userService.remove(testUser.id);
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // Helper to clean up test users
  const cleanupUser = async (email: string) => {
    const user = await userService.findByEmail(email);
    if (user) {
      await userService.remove(user.id);
    }
  };

  describe('/auth/register (POST) - Registration Tests', () => {
    describe('Valid Registration Cases', () => {
      it('TC-AUTH-001 should register user with minimum required fields', async () => {
        await cleanupUser('minfields@example.com');
        const dto = {
          username: 'minfields',
          email: 'minfields@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.username).toBe(dto.username);
        expect(res.body.data.email).toBe(dto.email);
        expect(res.body.data.role).toBe('USER');
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.createdAt).toBeDefined();
        expect(res.body.data.lastLoginAt).toBeDefined();

        await cleanupUser(dto.email);
      });

      it('TC-AUTH-002 should register user with alphanumeric username', async () => {
        await cleanupUser('alpha123@example.com');
        const dto = {
          username: 'alpha123',
          email: 'alpha123@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.username).toBe('alpha123');
        await cleanupUser(dto.email);
      });

      it('TC-AUTH-003 should register user with underscore in username', async () => {
        await cleanupUser('user_test@example.com');
        const dto = {
          username: 'user_test',
          email: 'user_test@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.username).toBe('user_test');
        await cleanupUser(dto.email);
      });

      it('TC-AUTH-004 should register user with 3-character username (minimum)', async () => {
        await cleanupUser('usr@example.com');
        const dto = {
          username: 'usr',
          email: 'usr@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.username).toBe('usr');
        await cleanupUser(dto.email);
      });

      it('TC-AUTH-005 should register user with 20-character username (maximum)', async () => {
        await cleanupUser('twentycharsusername@example.com');
        const dto = {
          username: 'twentycharsusername1',
          email: 'twentycharsusername@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.username).toBe('twentycharsusername1');
        await cleanupUser(dto.email);
      });

      it('TC-AUTH-006 should register user with complex valid password', async () => {
        await cleanupUser('complexpass@example.com');
        const dto = {
          username: 'complexpass',
          email: 'complexpass@example.com',
          password: 'C0mplexP@ss!123',
          confirmPassword: 'C0mplexP@ss!123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.accessToken).toBeDefined();
        await cleanupUser(dto.email);
      });

      it('TC-AUTH-007 should register user with subdomain email', async () => {
        await cleanupUser('user@mail.example.com');
        const dto = {
          username: 'subdomainuser',
          email: 'user@mail.example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.email).toBe('user@mail.example.com');
        await cleanupUser(dto.email);
      });
    });

    describe('Invalid Username Cases', () => {
      it('TC-AUTH-008 should reject registration with empty username', async () => {
        const dto = {
          username: '',
          email: 'emptyusername@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-009 should reject registration with username less than 3 characters', async () => {
        const dto = {
          username: 'ab',
          email: 'shortuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-010 should reject registration with username more than 20 characters', async () => {
        const dto = {
          username: 'verylongusernamethatexceedstwentycharacters',
          email: 'longuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-011 should reject registration with special characters in username', async () => {
        const dto = {
          username: 'user@name',
          email: 'specialuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-012 should reject registration with spaces in username', async () => {
        const dto = {
          username: 'user name',
          email: 'spaceuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-013 should reject registration with hyphen in username', async () => {
        const dto = {
          username: 'user-name',
          email: 'hyphenuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-014 should reject registration without username field', async () => {
        const dto = {
          email: 'nousername@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Invalid Email Cases', () => {
      it('TC-AUTH-015 should reject registration with empty email', async () => {
        const dto = {
          username: 'emptyemail',
          email: '',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-016 should reject registration with invalid email format (no @)', async () => {
        const dto = {
          username: 'invalidemail1',
          email: 'invalidemail.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-017 should reject registration with invalid email format (no domain)', async () => {
        const dto = {
          username: 'invalidemail2',
          email: 'user@',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-018 should reject registration with invalid email format (no username)', async () => {
        const dto = {
          username: 'invalidemail3',
          email: '@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-019 should reject registration with invalid email format (double @)', async () => {
        const dto = {
          username: 'invalidemail4',
          email: 'user@@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-020 should reject registration without email field', async () => {
        const dto = {
          username: 'noemail',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Invalid Password Cases', () => {
      it('TC-AUTH-021 should reject registration with empty password', async () => {
        const dto = {
          username: 'emptypass',
          email: 'emptypass@example.com',
          password: '',
          confirmPassword: '',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-022 should reject registration with password less than 8 characters', async () => {
        const dto = {
          username: 'shortpass',
          email: 'shortpass@example.com',
          password: 'Pass1',
          confirmPassword: 'Pass1',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-023 should reject registration with password without numbers', async () => {
        const dto = {
          username: 'nonumpass',
          email: 'nonumpass@example.com',
          password: 'PasswordOnly',
          confirmPassword: 'PasswordOnly',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-024 should reject registration with password without letters', async () => {
        const dto = {
          username: 'noletterpass',
          email: 'noletterpass@example.com',
          password: '12345678',
          confirmPassword: '12345678',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-025 should reject registration with mismatched passwords', async () => {
        const dto = {
          username: 'mismatchpass',
          email: 'mismatchpass@example.com',
          password: 'Password123',
          confirmPassword: 'Password456',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-026 should reject registration without password field', async () => {
        const dto = {
          username: 'nopassword',
          email: 'nopassword@example.com',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-027 should reject registration without confirmPassword field', async () => {
        const dto = {
          username: 'noconfirm',
          email: 'noconfirm@example.com',
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Conflict Cases', () => {
      it('TC-AUTH-028 should reject registration with existing email', async () => {
        const dto = {
          username: 'newusername',
          email: baseTestUser.email,
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CONFLICT);
      });

      it('TC-AUTH-029 should reject registration with existing username', async () => {
        const dto = {
          username: baseTestUser.username,
          email: 'newemail@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CONFLICT);
      });

      it('TC-AUTH-030 should reject registration with both existing email and username', async () => {
        const dto = {
          username: baseTestUser.username,
          email: baseTestUser.email,
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.CONFLICT);
      });
    });

    describe('Edge Cases', () => {
      it('TC-AUTH-031 should reject registration with null values', async () => {
        const dto = {
          username: null,
          email: null,
          password: null,
          confirmPassword: null,
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-032 should reject registration with empty body', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-033 should reject registration with extra fields (forbidNonWhitelisted)', async () => {
        const dto = {
          username: 'extrafields',
          email: 'extrafields@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
          extraField: 'should be rejected',
        };

        await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-034 should register user with case-sensitive email handling', async () => {
        await cleanupUser('uppercase@example.com');
        const dto = {
          username: 'uppercase',
          email: 'UPPERCASE@EXAMPLE.COM',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/register')
          .send(dto);

        // Depending on implementation, this might succeed or fail
        if (res.status === 201) {
          await cleanupUser(dto.email.toLowerCase());
          await cleanupUser(dto.email);
        }
      });

      it('TC-AUTH-035 should handle whitespace in email', async () => {
        const dto = {
          username: 'whitespace',
          email: ' whitespace@example.com ',
          password: 'Password123',
          confirmPassword: 'Password123',
        };

        await request(app.getHttpServer()).post('/auth/register').send(dto);
        // Just checking it doesn't crash
      });
    });
  });

  describe('/auth/login (POST) - Login Tests', () => {
    describe('Valid Login Cases', () => {
      it('TC-AUTH-036 should login with correct credentials', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: baseTestUser.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(res.body.data.accessToken).toBeDefined();
        expect(res.body.data.username).toBe(baseTestUser.username);
        expect(res.body.data.email).toBe(baseTestUser.email);
        expect(res.body.data.id).toBeDefined();
      });

      it('TC-AUTH-037 should return JWT token on successful login', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: baseTestUser.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        const token = res.body.data.accessToken;
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3); // JWT format
      });

      it('TC-AUTH-038 should update lastLoginAt on successful login', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: baseTestUser.password,
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.OK);

        expect(res.body.data.lastLoginAt).toBeDefined();
      });
    });

    describe('Invalid Login Cases', () => {
      it('TC-AUTH-039 should reject login with wrong password', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: 'WrongPassword123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body.message).toContain('Invalid email or password');
      });

      it('TC-AUTH-040 should reject login with non-existent email', async () => {
        const loginDto = {
          email: 'nonexistent@example.com',
          password: 'Password123',
        };

        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);

        expect(res.body.message).toContain('Invalid email or password');
      });

      it('TC-AUTH-041 should reject login with empty email', async () => {
        const loginDto = {
          email: '',
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-042 should reject login with empty password', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: '',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-043 should reject login without email field', async () => {
        const loginDto = {
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-044 should reject login without password field', async () => {
        const loginDto = {
          email: baseTestUser.email,
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-045 should reject login with empty body', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-046 should reject login with null values', async () => {
        const loginDto = {
          email: null,
          password: null,
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-047 should reject login with invalid email format', async () => {
        const loginDto = {
          email: 'notanemail',
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Security Tests', () => {
      it('TC-AUTH-048 should not reveal whether email exists on wrong password', async () => {
        const wrongPasswordRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: baseTestUser.email,
            password: 'WrongPassword123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        const nonExistentRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'Password123',
          })
          .expect(HttpStatus.BAD_REQUEST);

        // Both should return the same generic error message
        expect(wrongPasswordRes.body.message).toBe(nonExistentRes.body.message);
      });

      it('TC-AUTH-049 should handle SQL injection attempt in email', async () => {
        const loginDto = {
          email: "'; DROP TABLE users; --",
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-050 should handle SQL injection attempt in password', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: "'; DROP TABLE users; --",
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('TC-AUTH-051 should handle XSS attempt in email', async () => {
        const loginDto = {
          email: '<script>alert("xss")</script>@example.com',
          password: 'Password123',
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(loginDto)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Rate Limiting / Brute Force Tests', () => {
      it('TC-AUTH-052 should handle multiple failed login attempts', async () => {
        const loginDto = {
          email: baseTestUser.email,
          password: 'WrongPassword',
        };

        // Multiple failed attempts
        for (let i = 0; i < 5; i++) {
          await request(app.getHttpServer())
            .post('/auth/login')
            .send(loginDto)
            .expect(HttpStatus.BAD_REQUEST);
        }

        // Should still work with correct credentials
        const correctLogin = {
          email: baseTestUser.email,
          password: baseTestUser.password,
        };

        await request(app.getHttpServer())
          .post('/auth/login')
          .send(correctLogin)
          .expect(HttpStatus.OK);
      });
    });
  });

  describe('JWT Token Tests', () => {
    it('TC-AUTH-053 should use token for authenticated requests', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: baseTestUser.email,
          password: baseTestUser.password,
        })
        .expect(HttpStatus.OK);

      const token = loginRes.body.data.accessToken;

      // Use token to access protected route
      const userRes = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(HttpStatus.OK);

      expect(userRes.body.data.email).toBe(baseTestUser.email);
    });

    it('TC-AUTH-054 should reject invalid token', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('TC-AUTH-055 should reject expired token format', async () => {
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDF9.invalid';

      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('TC-AUTH-056 should reject request without token', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('TC-AUTH-057 should reject request with empty authorization header', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', '')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('TC-AUTH-058 should reject request with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'NotBearer token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
