import {
  ThreadType,
  UserRole,
} from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../errors/app-error';
import * as storageService from '../../storage/services/storage.service';
import { SendMessageInput } from '../schemas/messaging.schema';

async function assertCanAccessThread(
  threadId: string,
  userId: string,
  userRole: UserRole,
): Promise<void> {
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      participants: { select: { user_id: true } },
    },
  });

  if (!thread) {
    throw new NotFoundError('Thread not found');
  }

  const isParticipant = thread.participants.some((p) => p.user_id === userId);
  if (isParticipant) {
    return;
  }

  if (
    userRole === UserRole.ADMIN &&
    thread.thread_type === ThreadType.SUPPORT &&
    (thread.assigned_admin_id === null || thread.assigned_admin_id === userId)
  ) {
    return;
  }

  throw new ForbiddenError('You are not a participant of this thread');
}

export async function sendMessage(
  senderId: string,
  senderRole: UserRole,
  input: SendMessageInput,
) {
  if (input.thread_id) {
    await assertCanAccessThread(input.thread_id, senderId, senderRole);

    // Admins joining unassigned SUPPORT become assigned + participant
    if (senderRole === UserRole.ADMIN) {
      const thread = await prisma.thread.findUnique({
        where: { id: input.thread_id },
      });
      if (
        thread?.thread_type === ThreadType.SUPPORT &&
        (thread.assigned_admin_id === null ||
          thread.assigned_admin_id === senderId)
      ) {
        await prisma.$transaction(async (tx) => {
          if (thread.assigned_admin_id === null) {
            await tx.thread.update({
              where: { id: thread.id },
              data: { assigned_admin_id: senderId },
            });
          }
          await tx.threadParticipant.upsert({
            where: {
              thread_id_user_id: {
                thread_id: thread.id,
                user_id: senderId,
              },
            },
            create: { thread_id: thread.id, user_id: senderId },
            update: {},
          });
        });
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          thread_id: input.thread_id as string,
          sender_id: senderId,
          message_type: input.message_type,
          message_text: input.message_text,
          media_url: input.media_url,
        },
        include: {
          sender: {
            select: { id: true, name: true, username: true, role: true },
          },
        },
      });

      await tx.thread.update({
        where: { id: input.thread_id as string },
        data: { updated_at: new Date() },
      });

      return created;
    });

    return { message, thread_id: input.thread_id };
  }

  // Start new thread
  if (input.thread_type === 'SUPPORT') {
    const result = await prisma.$transaction(async (tx) => {
      const thread = await tx.thread.create({
        data: {
          thread_type: ThreadType.SUPPORT,
          property_id: null,
          assigned_admin_id: null,
          participants: {
            create: [{ user_id: senderId }],
          },
        },
      });

      const message = await tx.message.create({
        data: {
          thread_id: thread.id,
          sender_id: senderId,
          message_type: input.message_type,
          message_text: input.message_text,
          media_url: input.media_url,
        },
        include: {
          sender: {
            select: { id: true, name: true, username: true, role: true },
          },
        },
      });

      return { thread, message };
    });

    return { message: result.message, thread_id: result.thread.id };
  }

  if (!input.recipient_id) {
    throw new BadRequestError(
      'recipient_id is required to start a LISTING thread',
    );
  }

  if (input.recipient_id === senderId) {
    throw new BadRequestError('Cannot start a thread with yourself');
  }

  const recipient = await prisma.user.findFirst({
    where: { id: input.recipient_id, deleted_at: null },
    select: { id: true },
  });

  if (!recipient) {
    throw new NotFoundError('Recipient not found');
  }

  let propertyId: string | null = null;
  if (input.property_id) {
    const property = await prisma.property.findFirst({
      where: { id: input.property_id, deleted_at: null },
      select: { id: true, seller_id: true, status: true },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    propertyId = property.id;
  }

  // Reuse existing LISTING thread between these two (same property, or both null)
  const existing = await prisma.thread.findFirst({
    where: {
      thread_type: ThreadType.LISTING,
      property_id: propertyId,
      AND: [
        { participants: { some: { user_id: senderId } } },
        { participants: { some: { user_id: input.recipient_id } } },
      ],
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const thread =
      existing ??
      (await tx.thread.create({
        data: {
          thread_type: ThreadType.LISTING,
          property_id: propertyId,
          participants: {
            create: [
              { user_id: senderId },
              { user_id: input.recipient_id as string },
            ],
          },
        },
      }));

    if (existing) {
      await tx.threadParticipant.upsert({
        where: {
          thread_id_user_id: { thread_id: thread.id, user_id: senderId },
        },
        create: { thread_id: thread.id, user_id: senderId },
        update: {},
      });
      await tx.threadParticipant.upsert({
        where: {
          thread_id_user_id: {
            thread_id: thread.id,
            user_id: input.recipient_id as string,
          },
        },
        create: {
          thread_id: thread.id,
          user_id: input.recipient_id as string,
        },
        update: {},
      });
    }

    const message = await tx.message.create({
      data: {
        thread_id: thread.id,
        sender_id: senderId,
        message_type: input.message_type,
        message_text: input.message_text,
        media_url: input.media_url,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
    });

    await tx.thread.update({
      where: { id: thread.id },
      data: { updated_at: new Date() },
    });

    return { thread, message };
  });

  return { message: result.message, thread_id: result.thread.id };
}

export async function listThreads(userId: string, userRole: UserRole) {
  const participantThreads = await prisma.threadParticipant.findMany({
    where: { user_id: userId },
    select: { thread_id: true, last_read_at: true },
  });

  const participantIds = participantThreads.map((p) => p.thread_id);
  const lastReadMap = new Map(
    participantThreads.map((p) => [p.thread_id, p.last_read_at]),
  );

  const supportWhere =
    userRole === UserRole.ADMIN
      ? {
          thread_type: ThreadType.SUPPORT,
          OR: [
            { assigned_admin_id: null },
            { assigned_admin_id: userId },
            { id: { in: participantIds } },
          ],
        }
      : null;

  const threads = await prisma.thread.findMany({
    where: supportWhere
      ? {
          OR: [{ id: { in: participantIds } }, supportWhere],
        }
      : { id: { in: participantIds } },
    orderBy: { updated_at: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },
      },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1,
        include: {
          sender: {
            select: { id: true, name: true, username: true },
          },
        },
      },
      assignedAdmin: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  const withUnread = await Promise.all(
    threads.map(async (thread) => {
      const lastReadAt = lastReadMap.get(thread.id) ?? null;
      const unreadCount = await prisma.message.count({
        where: {
          thread_id: thread.id,
          sender_id: { not: userId },
          ...(lastReadAt
            ? { created_at: { gt: lastReadAt } }
            : {}),
        },
      });

      const lastMessage = thread.messages[0] ?? null;

      return {
        id: thread.id,
        thread_type: thread.thread_type,
        property: thread.property,
        assigned_admin: thread.assignedAdmin,
        participants: thread.participants.map((p) => p.user),
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: thread.updated_at,
        created_at: thread.created_at,
      };
    }),
  );

  return { threads: withUnread };
}

export async function getThreadMessages(
  threadId: string,
  userId: string,
  userRole: UserRole,
  page: number,
  limit: number,
) {
  await assertCanAccessThread(threadId, userId, userRole);

  // Ensure participant row exists for admins opening unassigned SUPPORT
  if (userRole === UserRole.ADMIN) {
    await prisma.threadParticipant.upsert({
      where: {
        thread_id_user_id: { thread_id: threadId, user_id: userId },
      },
      create: { thread_id: threadId, user_id: userId },
      update: {},
    });
  }

  const skip = (page - 1) * limit;

  const [total, messages] = await prisma.$transaction([
    prisma.message.count({ where: { thread_id: threadId } }),
    prisma.message.findMany({
      where: { thread_id: threadId },
      orderBy: { created_at: 'asc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: { id: true, name: true, username: true, role: true },
        },
      },
    }),
  ]);

  await prisma.threadParticipant.update({
    where: {
      thread_id_user_id: { thread_id: threadId, user_id: userId },
    },
    data: { last_read_at: new Date() },
  });

  const resolvedMessages = await Promise.all(
    messages.map(async (message) => {
      if (message.media_url?.startsWith('private/')) {
        return {
          ...message,
          media_url: await storageService.getPresignedReadUrl(
            message.media_url,
          ),
        };
      }
      return message;
    }),
  );

  return {
    messages: resolvedMessages,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
