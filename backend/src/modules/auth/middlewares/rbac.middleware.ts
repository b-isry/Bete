import { UserRole, VerificationStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { ForbiddenError, UnauthorizedError } from '../../../errors/app-error';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions for this action'));
      return;
    }

    next();
  };
}

export function requireVerifiedSeller(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  if (
    req.user.role !== UserRole.SELLER ||
    req.user.verification_status !== VerificationStatus.VERIFIED
  ) {
    next(new ForbiddenError('Only verified sellers can perform this action'));
    return;
  }

  next();
}
