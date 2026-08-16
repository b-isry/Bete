import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import { prisma } from '../../../config/prisma';
import { BadRequestError } from '../../../errors/app-error';
import { getEmailProvider } from '../../../integrations/email';
import {
  ConfirmPasswordResetInput,
  RequestPasswordResetInput,
} from '../schemas/auth.schema';

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const GENERIC_RESPONSE = {
  message:
    'If an account exists for that email, a password reset link has been sent.',
} as const;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Always returns the same payload (no email enumeration).
 * Sends a single-use reset link when the email matches an active user.
 */
export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<typeof GENERIC_RESPONSE> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      deleted_at: null,
      email: { equals: email, mode: 'insensitive' },
    },
    select: { id: true, email: true, name: true },
  });

  if (!user?.email) {
    return GENERIC_RESPONSE;
  }

  const rawToken = randomBytes(32).toString('hex');
  const token_hash = hashToken(rawToken);
  const expires_at = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { user_id: user.id, consumed_at: null },
      data: { consumed_at: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        user_id: user.id,
        token_hash,
        expires_at,
      },
    });
  });

  const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const html = `<div><p>Hi ${escapeHtml(user.name)},</p><p>Reset your Bete password using this link (expires in 1 hour):</p><p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p><p>If you did not request this, you can ignore this email.</p></div>`;

  try {
    await getEmailProvider().send(user.email, 'Reset your Bete password', html);
  } catch (err) {
    logger.error(
      `[password-reset] email failed for user=${user.id}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return GENERIC_RESPONSE;
}

export async function confirmPasswordReset(
  input: ConfirmPasswordResetInput,
): Promise<{ reset: true }> {
  const token_hash = hashToken(input.token.trim());
  const now = new Date();

  const record = await prisma.passwordResetToken.findFirst({
    where: {
      token_hash,
      consumed_at: null,
      expires_at: { gt: now },
    },
  });

  if (!record) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  const password_hash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.user_id },
      data: { password_hash },
    });
    await tx.passwordResetToken.update({
      where: { id: record.id },
      data: { consumed_at: new Date() },
    });
    await tx.passwordResetToken.updateMany({
      where: {
        user_id: record.user_id,
        consumed_at: null,
        id: { not: record.id },
      },
      data: { consumed_at: new Date() },
    });
  });

  return { reset: true };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
