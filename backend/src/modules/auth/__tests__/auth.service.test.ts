import { UserRole, VerificationStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../errors/app-error';
import * as authService from '../services/auth.service';

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
    verified_at: null,
    last_login_at: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('auth.service', () => {
  beforeEach(() => {
    prismaMock.user.findFirst.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.user.update.mockReset();
  });

  describe('register', () => {
    it('hashes the password, creates the user, and returns a JWT', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(profile({ role: UserRole.SELLER }));

      const result = await authService.register({
        name: 'Abebe Kebede',
        phone: '0912345678',
        email: 'abebe@example.com',
        password: 'Password1',
        role: 'SELLER',
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '0912345678',
            role: UserRole.SELLER,
            password_hash: expect.any(String),
          }),
        }),
      );

      const createArgs = prismaMock.user.create.mock.calls[0][0];
      const matches = await bcrypt.compare(
        'Password1',
        createArgs.data.password_hash as string,
      );
      expect(matches).toBe(true);

      const decoded = jwt.verify(result.token, env.JWT_SECRET) as jwt.JwtPayload;
      expect(decoded.id).toBe('user-1');
      expect(decoded.role).toBe(UserRole.SELLER);
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('rejects duplicate phone among non-deleted users', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        id: 'existing',
        phone: '0912345678',
        email: null,
      });

      await expect(
        authService.register({
          name: 'Abebe',
          phone: '0912345678',
          password: 'Password1',
          role: 'USER',
        }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe('login', () => {
    it('authenticates non-deleted users and updates last_login_at', async () => {
      const password_hash = await bcrypt.hash('Password1', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        ...profile(),
        password_hash,
        deleted_at: null,
      });
      prismaMock.user.update.mockResolvedValue(
        profile({ last_login_at: new Date('2026-07-22T00:00:00.000Z') }),
      );

      const result = await authService.login({
        phone: '0912345678',
        password: 'Password1',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { last_login_at: expect.any(Date) },
        }),
      );
      expect(result.token).toEqual(expect.any(String));
    });

    it('rejects soft-deleted or missing users', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        authService.login({ phone: '0912345678', password: 'Password1' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('rejects invalid passwords', async () => {
      const password_hash = await bcrypt.hash('Password1', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        ...profile(),
        password_hash,
        deleted_at: null,
      });

      await expect(
        authService.login({ phone: '0912345678', password: 'WrongPass1' }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('submitVerification', () => {
    it('sets verification_status to PENDING without changing role', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...profile({ role: UserRole.SELLER }),
        password_hash: 'hash',
        deleted_at: null,
      });
      prismaMock.user.update.mockResolvedValue(
        profile({
          role: UserRole.SELLER,
          verification_status: VerificationStatus.PENDING,
          id_document_url: 'https://cdn.example.com/id.pdf',
        }),
      );

      const user = await authService.submitVerification('user-1', {
        id_document_url: 'https://cdn.example.com/id.pdf',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verification_status: 'PENDING',
            id_document_url: 'https://cdn.example.com/id.pdf',
          }),
        }),
      );
      expect(user.role).toBe(UserRole.SELLER);
      expect(user.verification_status).toBe(VerificationStatus.PENDING);
    });

    it('rejects non-sellers', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...profile({ role: UserRole.USER }),
        password_hash: 'hash',
        deleted_at: null,
      });

      await expect(
        authService.submitVerification('user-1', {
          id_document_url: 'https://cdn.example.com/id.pdf',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('getProfile', () => {
    it('returns the active user profile', async () => {
      prismaMock.user.findFirst.mockResolvedValue(profile());

      const user = await authService.getProfile('user-1');
      expect(user.id).toBe('user-1');
    });

    it('rejects missing or deleted users', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(authService.getProfile('missing')).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });
});
