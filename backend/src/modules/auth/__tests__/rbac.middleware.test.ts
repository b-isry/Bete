import { UserRole, VerificationStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import {
  ForbiddenError,
  UnauthorizedError,
} from '../../../errors/app-error';
import {
  requireRole,
  requireVerifiedSeller,
} from '../middlewares/rbac.middleware';

function createReq(user?: Request['user']): Request {
  return { user } as Request;
}

describe('requireRole', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() when role is allowed', () => {
    requireRole(UserRole.SELLER, UserRole.ADMIN)(
      createReq({
        id: 'u1',
        role: UserRole.SELLER,
        verification_status: VerificationStatus.UNVERIFIED,
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects unauthenticated requests', () => {
    requireRole(UserRole.USER)(createReq(undefined), res, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('rejects when role is not allowed', () => {
    requireRole(UserRole.ADMIN)(
      createReq({
        id: 'u1',
        role: UserRole.USER,
        verification_status: VerificationStatus.UNVERIFIED,
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});

describe('requireVerifiedSeller', () => {
  const res = {} as Response;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('allows verified sellers only', () => {
    requireVerifiedSeller(
      createReq({
        id: 'u1',
        role: UserRole.SELLER,
        verification_status: VerificationStatus.VERIFIED,
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects unverified sellers', () => {
    requireVerifiedSeller(
      createReq({
        id: 'u1',
        role: UserRole.SELLER,
        verification_status: VerificationStatus.PENDING,
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('rejects verified non-sellers (role alone is insufficient)', () => {
    requireVerifiedSeller(
      createReq({
        id: 'u1',
        role: UserRole.ADMIN,
        verification_status: VerificationStatus.VERIFIED,
      }),
      res,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });
});
