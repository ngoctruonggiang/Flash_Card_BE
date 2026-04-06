/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/services/user/user.service';
import { DeckService } from 'src/services/deck/deck.service';
import { SignUpDto } from 'src/utils/types/dto/user/signUp.dto';
import { AuthResponseDto } from 'src/utils/types/dto/user/authResponse.dto';
import { createTestUser } from './create-test-user';

describe('User Controller Comprehensive E2E Tests', () => {
  let app: INestApplication<App>;
  let userService: UserService;
  let deckService: DeckService;

  const baseTestUser: SignUpDto = {
    username: 'usercomprehensive',
    email: 'usercomprehensive@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
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
    deckService = moduleFixture.get<DeckService>(DeckService);

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

  describe('/user (GET) - Get Current User Tests', () => {
    describe('Valid Cases', () => {
      it('should return current user profile', async () => {
        const res = await authRequest().get('/user').expect(HttpStatus.OK);

        expect(res.body.data).toBeDefined();
        expect(res.body.data.username).toBe(baseTestUser.username);
        expect(res.body.data.email).toBe(baseTestUser.email);
      });

      it('should return user with correct structure', async () => {
        const res = await authRequest().get('/user').expect(HttpStatus.OK);

        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('username');
        expect(res.body.data).toHaveProperty('email');
        expect(res.body.data).toHaveProperty('role');
        expect(res.body.data).toHaveProperty('createdAt');
      });

      it('should not return password hash', async () => {
        const res = await authRequest().get('/user').expect(HttpStatus.OK);

        expect(res.body.data.passwordHash).toBeUndefined();
        expect(res.body.data.password).toBeUndefined();
      });

      it('should return correct role', async () => {
        const res = await authRequest().get('/user').expect(HttpStatus.OK);

        expect(['USER', 'ADMIN']).toContain(res.body.data.role);
      });
    });

    describe('Invalid Cases', () => {
      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/user')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/user')
          .set('Authorization', 'Bearer invalid.token.here')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject with malformed authorization header', async () => {
        await request(app.getHttpServer())
          .get('/user')
          .set('Authorization', 'NotBearer token')
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject with empty authorization header', async () => {
        await request(app.getHttpServer())
          .get('/user')
          .set('Authorization', '')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });
  });

  describe('/user (PATCH) - Update Current User Tests', () => {
    describe('Valid Updates', () => {
      it('should update username', async () => {
        const newUsername = 'updatedusername1';

        const res = await authRequest()
          .patch('/user')
          .send({ username: newUsername })
          .expect(HttpStatus.OK);

        expect(res.body.data.username).toBe(newUsername);

        // Reset username
        await authRequest()
          .patch('/user')
          .send({ username: baseTestUser.username });
      });

      it('should update email', async () => {
        const newEmail = 'updatedemail1@example.com';

        const res = await authRequest()
          .patch('/user')
          .send({ email: newEmail })
          .expect(HttpStatus.OK);

        expect(res.body.data.email).toBe(newEmail);

        // Reset email
        await authRequest().patch('/user').send({ email: baseTestUser.email });
      });

      it('should update password', async () => {
        const newPassword = 'NewPassword123';

        await authRequest()
          .patch('/user')
          .send({ password: newPassword })
          .expect(HttpStatus.OK);

        // Verify login with new password
        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: baseTestUser.email, password: newPassword })
          .expect(HttpStatus.OK);

        expect(loginRes.body.data.accessToken).toBeDefined();

        // Reset password
        await request(app.getHttpServer())
          .patch('/user')
          .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
          .send({ password: baseTestUser.password });

        // Update testUser token
        const resetLogin = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: baseTestUser.email,
            password: baseTestUser.password,
          });
        testUser.accessToken = resetLogin.body.data.accessToken;
      });

      it('should update role to ADMIN', async () => {
        const res = await authRequest()
          .patch('/user')
          .send({ role: 'ADMIN' })
          .expect(HttpStatus.OK);

        expect(res.body.data.role).toBe('ADMIN');

        // Reset to USER
        await authRequest().patch('/user').send({ role: 'USER' });
      });

      it('should update role to USER', async () => {
        // First set to ADMIN
        await authRequest().patch('/user').send({ role: 'ADMIN' });

        const res = await authRequest()
          .patch('/user')
          .send({ role: 'USER' })
          .expect(HttpStatus.OK);

        expect(res.body.data.role).toBe('USER');
      });

      it('should update multiple fields at once', async () => {
        const res = await authRequest()
          .patch('/user')
          .send({
            username: 'multiupdate',
            email: 'multiupdate@example.com',
          })
          .expect(HttpStatus.OK);

        expect(res.body.data.username).toBe('multiupdate');
        expect(res.body.data.email).toBe('multiupdate@example.com');

        // Reset
        await authRequest()
          .patch('/user')
          .send({ username: baseTestUser.username, email: baseTestUser.email });
      });
    });

    describe('Invalid Updates', () => {
      it('should reject update with invalid email format', async () => {
        await authRequest()
          .patch('/user')
          .send({ email: 'notanemail' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject update with invalid role', async () => {
        await authRequest()
          .patch('/user')
          .send({ role: 'INVALID_ROLE' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject update with extra non-whitelisted fields', async () => {
        await authRequest()
          .patch('/user')
          .send({ username: 'valid', extraField: 'invalid' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .patch('/user')
          .send({ username: 'unauthorized' })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should reject empty username', async () => {
        await authRequest()
          .patch('/user')
          .send({ username: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject empty email', async () => {
        await authRequest()
          .patch('/user')
          .send({ email: '' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject username with special characters', async () => {
        await authRequest()
          .patch('/user')
          .send({ username: 'user@name' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject short username', async () => {
        await authRequest()
          .patch('/user')
          .send({ username: 'ab' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject long username', async () => {
        await authRequest()
          .patch('/user')
          .send({ username: 'a'.repeat(25) })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('Conflict Cases', () => {
      it('should reject update with existing email', async () => {
        // Create another user
        await cleanupUser('conflictuser@example.com');
        const otherUser = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'conflictuser',
            email: 'conflictuser@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          });

        // Try to update to existing email
        await authRequest()
          .patch('/user')
          .send({ email: 'conflictuser@example.com' })
          .expect(HttpStatus.CONFLICT);

        // Cleanup
        await userService.remove(Number(otherUser.body.data.id));
      });

      it('should reject update with existing username', async () => {
        // Create another user
        await cleanupUser('conflictuser2@example.com');
        const otherUser = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'conflictuser2',
            email: 'conflictuser2@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          });

        // Try to update to existing username
        await authRequest()
          .patch('/user')
          .send({ username: 'conflictuser2' })
          .expect(HttpStatus.CONFLICT);

        // Cleanup
        await userService.remove(Number(otherUser.body.data.id));
      });
    });
  });

  describe('/user (DELETE) - Delete Current User Tests', () => {
    it('should delete current user', async () => {
      // Create a temp user for deletion
      await cleanupUser('deleteuser@example.com');
      const tempUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'deleteuser',
          email: 'deleteuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CREATED);

      const tempToken = tempUser.body.data.accessToken;
      const tempUserId = Number(tempUser.body.data.id);

      // Delete the user
      await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(HttpStatus.OK);

      // Verify user is gone
      const deletedUser = await userService.getUserById(tempUserId);
      expect(deletedUser).toBeNull();
    });

    it('should cascade delete user decks', async () => {
      // Create temp user
      await cleanupUser('cascadeuser@example.com');
      const tempUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'cascadeuser',
          email: 'cascadeuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CREATED);

      const tempToken = tempUser.body.data.accessToken;
      const tempUserId = Number(tempUser.body.data.id);

      // Create deck for temp user
      const deck = await deckService.create(tempUserId, {
        title: 'Cascade Test Deck',
      });

      // Delete user
      await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(HttpStatus.OK);

      // Verify deck is also deleted
      const deletedDeck = await deckService.findOne(deck.id);
      expect(deletedDeck).toBeNull();
    });

    it('should reject without authentication', async () => {
      await request(app.getHttpServer())
        .delete('/user')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should invalidate token after deletion', async () => {
      // Create temp user
      await cleanupUser('invalidateuser@example.com');
      const tempUser = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'invalidateuser',
          email: 'invalidateuser@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CREATED);

      const tempToken = tempUser.body.data.accessToken;

      // Delete user
      await request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(HttpStatus.OK);

      // Try to use deleted user's token
      await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Admin Actions', () => {
    let adminUser: AuthResponseDto;
    let targetUser: AuthResponseDto;

    beforeAll(async () => {
      // Create Admin User
      await cleanupUser('admincompr@example.com');
      const adminRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'admincompr',
          email: 'admincompr@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CREATED);

      adminUser = adminRes.body.data;

      // Promote to ADMIN
      await request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${adminUser.accessToken}`)
        .send({ role: 'ADMIN' });

      // Create Target User
      await cleanupUser('targetcompr@example.com');
      const targetRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'targetcompr',
          email: 'targetcompr@example.com',
          password: 'Password123',
          confirmPassword: 'Password123',
        })
        .expect(HttpStatus.CREATED);

      targetUser = targetRes.body.data;
    });

    afterAll(async () => {
      if (adminUser) {
        try {
          await userService.remove(adminUser.id);
        } catch {
          // Ignore
        }
      }
      if (targetUser) {
        try {
          await userService.remove(targetUser.id);
        } catch {
          // Ignore
        }
      }
    });

    describe('/user/all (GET) - Admin Get All Users', () => {
      it('should return all users for admin', async () => {
        const res = await request(app.getHttpServer())
          .get('/user/all')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThan(0);
      });

      it('should return users with correct structure', async () => {
        const res = await request(app.getHttpServer())
          .get('/user/all')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        if (res.body.data.length > 0) {
          const user = res.body.data[0];
          expect(user).toHaveProperty('id');
          expect(user).toHaveProperty('username');
          expect(user).toHaveProperty('email');
          expect(user).toHaveProperty('role');
        }
      });

      it('should not return password hash', async () => {
        const res = await request(app.getHttpServer())
          .get('/user/all')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        for (const user of res.body.data) {
          expect(user.passwordHash).toBeUndefined();
        }
      });

      it('should reject non-admin user', async () => {
        await request(app.getHttpServer())
          .get('/user/all')
          .set('Authorization', `Bearer ${targetUser.accessToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/user/all')
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('/user/:id (GET) - Admin Get User By ID', () => {
      it('should return user by id for admin', async () => {
        const res = await request(app.getHttpServer())
          .get(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        expect(res.body.data.id).toBe(targetUser.id);
        expect(res.body.data.username).toBe(targetUser.username);
      });

      it('should return 404 for non-existent user', async () => {
        await request(app.getHttpServer())
          .get('/user/999999')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should return 400 for invalid user id', async () => {
        await request(app.getHttpServer())
          .get('/user/invalid')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject non-admin user', async () => {
        await request(app.getHttpServer())
          .get(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${targetUser.accessToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get(`/user/${targetUser.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('/user/:id (PATCH) - Admin Update User', () => {
      it('should update user by id for admin', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({ username: 'adminupdated' })
          .expect(HttpStatus.OK);

        expect(res.body.data.username).toBe('adminupdated');

        // Reset
        await request(app.getHttpServer())
          .patch(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({ username: 'targetcompr' });
      });

      it('should update user role for admin', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({ role: 'ADMIN' })
          .expect(HttpStatus.OK);

        expect(res.body.data.role).toBe('ADMIN');

        // Reset
        await request(app.getHttpServer())
          .patch(`/user/${targetUser.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({ role: 'USER' });
      });

      it('should return 404 for non-existent user', async () => {
        await request(app.getHttpServer())
          .patch('/user/999999')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .send({ username: 'test' })
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should reject non-admin user', async () => {
        await request(app.getHttpServer())
          .patch(`/user/${adminUser.id}`)
          .set('Authorization', `Bearer ${targetUser.accessToken}`)
          .send({ username: 'hacked' })
          .expect(HttpStatus.FORBIDDEN);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .patch(`/user/${targetUser.id}`)
          .send({ username: 'unauthorized' })
          .expect(HttpStatus.UNAUTHORIZED);
      });
    });

    describe('/user/:id (DELETE) - Admin Delete User', () => {
      it('should delete user by id for admin', async () => {
        // Create user to delete
        await cleanupUser('admindelete@example.com');
        const tempUser = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'admindelete',
            email: 'admindelete@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          })
          .expect(HttpStatus.CREATED);

        await request(app.getHttpServer())
          .delete(`/user/${tempUser.body.data.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        // Verify deletion
        const deleted = await userService.getUserById(
          Number(tempUser.body.data.id),
        );
        expect(deleted).toBeNull();
      });

      it('should return 404 for non-existent user', async () => {
        await request(app.getHttpServer())
          .delete('/user/999999')
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.NOT_FOUND);
      });

      it('should reject non-admin user', async () => {
        await request(app.getHttpServer())
          .delete(`/user/${adminUser.id}`)
          .set('Authorization', `Bearer ${targetUser.accessToken}`)
          .expect(HttpStatus.FORBIDDEN);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .delete(`/user/${targetUser.id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should cascade delete user data', async () => {
        // Create user with data
        await cleanupUser('cascadeadmin@example.com');
        const tempUser = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            username: 'cascadeadmin',
            email: 'cascadeadmin@example.com',
            password: 'Password123',
            confirmPassword: 'Password123',
          })
          .expect(HttpStatus.CREATED);

        // Create deck for temp user
        const deck = await deckService.create(Number(tempUser.body.data.id), {
          title: 'Admin Cascade Deck',
        });

        // Admin deletes user
        await request(app.getHttpServer())
          .delete(`/user/${tempUser.body.data.id}`)
          .set('Authorization', `Bearer ${adminUser.accessToken}`)
          .expect(HttpStatus.OK);

        // Verify deck is deleted
        const deletedDeck = await deckService.findOne(deck.id);
        expect(deletedDeck).toBeNull();
      });
    });
  });

  describe('User Edge Cases', () => {
    it('should handle user with unicode characters in username', async () => {
      // Unicode not allowed in username, should reject
      await authRequest()
        .patch('/user')
        .send({ username: 'user_émoji' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle rapid profile updates', async () => {
      for (let i = 0; i < 5; i++) {
        await authRequest()
          .patch('/user')
          .send({ username: `rapidupdate${i}` })
          .expect(HttpStatus.OK);
      }

      // Reset
      await authRequest()
        .patch('/user')
        .send({ username: baseTestUser.username });
    });

    it('should handle updating own email to current email', async () => {
      const res = await authRequest()
        .patch('/user')
        .send({ email: baseTestUser.email })
        .expect(HttpStatus.OK);

      expect(res.body.data.email).toBe(baseTestUser.email);
    });

    it('should handle updating own username to current username', async () => {
      const res = await authRequest()
        .patch('/user')
        .send({ username: baseTestUser.username })
        .expect(HttpStatus.OK);

      expect(res.body.data.username).toBe(baseTestUser.username);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrong' })
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).not.toContain('password');
      expect(res.body.message).not.toContain('hash');
    });

    it('should handle SQL injection in username', async () => {
      await authRequest()
        .patch('/user')
        .send({ username: "'; DROP TABLE users; --" })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle SQL injection in email', async () => {
      await authRequest()
        .patch('/user')
        .send({ email: "admin'--@example.com" })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle XSS in username', async () => {
      await authRequest()
        .patch('/user')
        .send({ username: '<script>alert(1)</script>' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
