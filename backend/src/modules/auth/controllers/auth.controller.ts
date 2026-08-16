import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import { OtpPurpose } from '@prisma/client';
import {
  LoginInput,
  RegisterInput,
  SubmitVerificationInput,
  UpdateSellerProfileInput,
  VerifyOtpInput,
  ConfirmPasswordResetInput,
  RequestPasswordResetInput,
} from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import * as otpService from '../services/otp.service';
import * as passwordResetService from '../services/password-reset.service';

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

export async function updateSellerProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const user = await authService.updateSellerProfile(
      req.user.id,
      req.body as UpdateSellerProfileInput,
    );
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

export async function requestOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const result = await otpService.requestOtp(
      req.user.id,
      OtpPurpose.SELLER_VERIFICATION,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const { code } = req.body as VerifyOtpInput;
    const result = await otpService.verifyOtp(
      req.user.id,
      OtpPurpose.SELLER_VERIFICATION,
      code,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await passwordResetService.requestPasswordReset(
      req.body as RequestPasswordResetInput,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function confirmPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await passwordResetService.confirmPasswordReset(
      req.body as ConfirmPasswordResetInput,
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
