import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import {
  LoginInput,
  RegisterInput,
  SubmitVerificationInput,
} from '../schemas/auth.schema';
import * as authService from '../services/auth.service';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const user = await authService.getProfile(req.user.id);
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function submitVerification(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const user = await authService.submitVerification(
      req.user.id,
      req.body as SubmitVerificationInput,
    );
    sendSuccess(res, { user });
  } catch (err) {
    next(err);
  }
}
