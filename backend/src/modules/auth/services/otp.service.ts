import { OtpPurpose } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../../errors/app-error';
import { getSmsProvider } from '../../../integrations/sms';

const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const APP_NAME = 'Bete';

async function loadUserPhone(userId: string): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { phone: true },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user.phone;
}

function generateNumericOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function requestOtp(
  userId: string,
  purpose: OtpPurpose,
): Promise<{ sent: true }> {
  const phone = await loadUserPhone(userId);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const recentCount = await prisma.otpCode.count({
    where: {
      phone,
      purpose,
      created_at: { gte: windowStart },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    throw new TooManyRequestsError(
      'Too many OTP requests. Please wait before requesting a new code.',
    );
  }

  const code = generateNumericOtp();
  const code_hash = await bcrypt.hash(code, BCRYPT_ROUNDS);
  const expires_at = new Date(Date.now() + OTP_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.otpCode.updateMany({
      where: {
        phone,
        purpose,
        consumed_at: null,
      },
      data: { consumed_at: new Date() },
    });

    await tx.otpCode.create({
      data: {
        phone,
        code_hash,
        purpose,
        expires_at,
      },
    });
  });

  const message = `Your ${APP_NAME} verification code is ${code}. It expires in 5 minutes.`;
  await getSmsProvider().send(phone, message);

  return { sent: true };
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string,
): Promise<{ verified: true }> {
  const phone = await loadUserPhone(userId);
  const now = new Date();

  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      purpose,
      consumed_at: null,
      expires_at: { gt: now },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!otp) {
    throw new NotFoundError('No active verification code found. Request a new one.');
  }

  if (otp.attempts >= otp.max_attempts) {
    throw new BadRequestError('Too many attempts, request a new code');
  }

  const matches = await bcrypt.compare(code, otp.code_hash);
  if (!matches) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new BadRequestError('Invalid verification code');
  }

  await prisma.$transaction(async (tx) => {
    await tx.otpCode.update({
      where: { id: otp.id },
      data: { consumed_at: now },
    });

    if (purpose === OtpPurpose.SELLER_VERIFICATION) {
      await tx.user.update({
        where: { id: userId },
        data: { phone_verified_at: now },
      });
    }
  });

  return { verified: true };
}
