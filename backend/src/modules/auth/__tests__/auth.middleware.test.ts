import { UserRole, VerificationStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { UnauthorizedError } from '../../../errors/app-error';
import { authenticate } from '../middlewares/auth.middleware';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

const prismaMock = prisma as unknown as {
  user: { findFirst: jest.Mock };
};

describe('authenticate middleware', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;
  let req: Partial<Request>;

  beforeEach(() => {
    next = jest.fn();
    req = { headers: {} };
    prismaMock.user.findFirst.mockReset();
  });

  it('rejects missing Authorization header', async () => {
    await authenticate(req as Request, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens', async () => {
    req.headers = { authorization: 'Bearer not-a-valid-token' };

    await authenticate(req as Request, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('rejects soft-deleted users', async () => {
    const token = jwt.sign(
      {
        id: 'user-1',
        role: UserRole.USER,
        verification_status: VerificationStatus.UNVERIFIED,
      },
      env.JWT_SECRET,
    );
    req.headers = { authorization: `Bearer ${token}` };
    prismaMock.user.findFirst.mockResolvedValue(null);

    await authenticate(req as Request, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('attaches req.user for a valid active user', async () => {
    const token = jwt.sign(
      {
        id: 'user-1',
        role: UserRole.SELLER,
        verification_status: VerificationStatus.VERIFIED,
      },
      env.JWT_SECRET,
    );
    req.headers = { authorization: `Bearer ${token}` };
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'user-1',
      role: UserRole.SELLER,
      verification_status: VerificationStatus.VERIFIED,
      deleted_at: null,
    });

    await authenticate(req as Request, res, next);

    expect(req.user).toEqual({
      id: 'user-1',
      role: UserRole.SELLER,
      verification_status: VerificationStatus.VERIFIED,
    });
    expect(next).toHaveBeenCalledWith();
  });
});
