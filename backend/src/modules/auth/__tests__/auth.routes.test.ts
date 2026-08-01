import { UserRole, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import express, { Application } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { errorMiddleware } from '../../../middlewares/error.middleware';
import { authRouter } from '../routes/auth.routes';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: {
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

function createTestApp(): Application {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use(errorMiddleware);
  return app;
}

function profile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    name: 'Abebe Kebede',
    username: null,
    phone: '0912345678',
    email: 'abebe@example.com',
    whatsapp_number: null,
    telegram_username: null,
    facebook_url: null,
    role: UserRole.USER,
    verification_status: VerificationStatus.UNVERIFIED,
    id_document_url: null,
    business_license_url: null,
    phone_verified_at: null,
    verified_at: null,
    last_login_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updated_at: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

describe('auth routes', () => {
  const app = createTestApp();

  beforeEach(() => {
    prismaMock.user.findFirst.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.user.update.mockReset();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a user and returns token + profile', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(profile());

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Abebe Kebede',
        phone: '0912345678',
        email: 'abebe@example.com',
        password: 'Password1',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toEqual(expect.any(String));
      expect(res.body.data.user.phone).toBe('0912345678');
      expect(res.body.data.user).not.toHaveProperty('password_hash');
    });

    it('returns 400 for invalid payloads (e.g. ADMIN role)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Abebe Kebede',
        phone: '0912345678',
        password: 'Password1',
        role: 'ADMIN',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with phone and password', async () => {
      const password_hash = await bcrypt.hash('Password1', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        ...profile(),
        password_hash,
        deleted_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      prismaMock.user.update.mockResolvedValue({
        ...profile({ last_login_at: new Date().toISOString() }),
      });

      const res = await request(app).post('/api/v1/auth/login').send({
        phone: '0912345678',
        password: 'Password1',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toEqual(expect.any(String));
    });

    it('returns 401 for bad credentials', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        phone: '0912345678',
        password: 'Password1',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('requires a Bearer token', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
    });

    it('returns the current user profile', async () => {
      const token = jwt.sign(
        {
          id: 'user-1',
          role: UserRole.USER,
          verification_status: VerificationStatus.UNVERIFIED,
        },
        env.JWT_SECRET,
      );

      prismaMock.user.findFirst
        .mockResolvedValueOnce({
          id: 'user-1',
          role: UserRole.USER,
          verification_status: VerificationStatus.UNVERIFIED,
          deleted_at: null,
        })
        .mockResolvedValueOnce(profile());

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe('user-1');
    });
  });

  describe('POST /api/v1/auth/verify-request', () => {
    it('allows sellers to submit verification', async () => {
      const token = jwt.sign(
        {
          id: 'user-1',
          role: UserRole.SELLER,
          verification_status: VerificationStatus.UNVERIFIED,
        },
        env.JWT_SECRET,
      );

      prismaMock.user.findFirst
        .mockResolvedValueOnce({
          id: 'user-1',
          role: UserRole.SELLER,
          verification_status: VerificationStatus.UNVERIFIED,
          deleted_at: null,
        })
        .mockResolvedValueOnce({
          ...profile({
            role: UserRole.SELLER,
            phone_verified_at: new Date().toISOString(),
          }),
          password_hash: 'hash',
          deleted_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        });

      prismaMock.user.update.mockResolvedValue(
        profile({
          role: UserRole.SELLER,
          verification_status: VerificationStatus.PENDING,
          id_document_url: 'https://cdn.example.com/id.pdf',
        }),
      );

      const res = await request(app)
        .post('/api/v1/auth/verify-request')
        .set('Authorization', `Bearer ${token}`)
        .send({ id_document_url: 'https://cdn.example.com/id.pdf' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.verification_status).toBe('PENDING');
      expect(res.body.data.user.role).toBe('SELLER');
    });

    it('forbids non-sellers', async () => {
      const token = jwt.sign(
        {
          id: 'user-1',
          role: UserRole.USER,
          verification_status: VerificationStatus.UNVERIFIED,
        },
        env.JWT_SECRET,
      );

      prismaMock.user.findFirst.mockResolvedValue({
        id: 'user-1',
        role: UserRole.USER,
        verification_status: VerificationStatus.UNVERIFIED,
        deleted_at: null,
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-request')
        .set('Authorization', `Bearer ${token}`)
        .send({ id_document_url: 'https://cdn.example.com/id.pdf' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });
});
