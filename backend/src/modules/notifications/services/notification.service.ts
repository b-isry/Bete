import { NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { logger } from '../../../config/logger';
import { getEmailProvider } from '../../../integrations/email';
import { NotFoundError } from '../../../errors/app-error';

function toEmailHtml(title: string, body: string, linkUrl?: string | null): string {
  const escapedTitle = escapeHtml(title);
  const escapedBody = escapeHtml(body).replace(/\n/g, '<br />');
  const linkBlock =
    linkUrl != null && linkUrl.length > 0
      ? `<p><a href="${escapeHtml(linkUrl)}">${escapeHtml(linkUrl)}</a></p>`
      : '';

  return `<div><h2>${escapedTitle}</h2><p>${escapedBody}</p>${linkBlock}</div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Persists an in-app Notification and sends email when the user has an address.
 * Email delivery failures are logged but do not roll back the in-app row.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  linkUrl?: string | null,
): Promise<{ id: string }> {
  const notification = await prisma.notification.create({
    data: {
      user_id: userId,
      type,
      title,
      body,
      link_url: linkUrl ?? null,
    },
    select: { id: true },
  });

  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: { email: true },
  });

  if (!user?.email) {
    logger.info(
      `[email:${type}] skipped — no email on file for user=${userId}`,
    );
    return notification;
  }

  try {
    await getEmailProvider().send(
      user.email,
      title,
      toEmailHtml(title, body, linkUrl),
    );
  } catch (err) {
    logger.error(
      `[email:${type}] failed for user=${userId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  return notification;
}

export async function listNotifications(
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit;
  const where: Prisma.NotificationWhereInput = { user_id: userId };

  const [total, items] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        link_url: true,
        read_at: true,
        created_at: true,
      },
    }),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      read_at: item.read_at?.toISOString() ?? null,
      created_at: item.created_at.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function markRead(
  userId: string,
  notificationId: string,
): Promise<{ id: string; read_at: string }> {
  const existing = await prisma.notification.findFirst({
    where: { id: notificationId, user_id: userId },
    select: { id: true, read_at: true },
  });

  if (!existing) {
    throw new NotFoundError('Notification not found');
  }

  if (existing.read_at) {
    return {
      id: existing.id,
      read_at: existing.read_at.toISOString(),
    };
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read_at: new Date() },
    select: { id: true, read_at: true },
  });

  return {
    id: updated.id,
    read_at: updated.read_at!.toISOString(),
  };
}

export async function markAllRead(
  userId: string,
): Promise<{ updatedCount: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      user_id: userId,
      read_at: null,
    },
    data: { read_at: new Date() },
  });

  return { updatedCount: result.count };
}
