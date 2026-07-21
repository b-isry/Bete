import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import { UnauthorizedError } from '../../../errors/app-error';
import { AuthUserPayload } from '../../../types/express';

interface JwtPayload {
  id: string;
  role: AuthUserPayload['role'];
  verification_status: AuthUserPayload['verification_status'];
}

function isJwtPayload(value: unknown): value is JwtPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.role === 'string' &&
    typeof candidate.verification_status === 'string'
  );
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    let decoded: unknown;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    if (!isJwtPayload(decoded)) {
      throw new UnauthorizedError('Invalid token payload');
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deleted_at: null },
      select: {
        id: true,
        role: true,
        verification_status: true,
        deleted_at: true,
      },
    });

    if (!user || user.deleted_at !== null) {
      throw new UnauthorizedError('User account is inactive or deleted');
    }

    req.user = {
      id: user.id,
      role: user.role,
      verification_status: user.verification_status,
    };

    next();
  } catch (err) {
    next(err);
  }
}
