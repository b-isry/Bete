import {
  MessageType,
  PropertyStatus,
  ThreadType,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
} from '../../../errors/app-error';
import {
  ModerateListingInput,
  VerifySellerInput,
} from '../schemas/admin.schema';

function slugifyName(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '')
    .slice(0, 20);
  return slug.length > 0 ? slug : 'seller';
}

export async function generateUniqueUsername(name: string): Promise<string> {
  const base = slugifyName(name);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = attempt === 0 ? `@${base}` : `@${base}${attempt}`;
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  return `@${base}${Date.now().toString(36)}`;
}

export async function listPendingListings(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = {
    status: PropertyStatus.PENDING,
    deleted_at: null,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'asc' },
      include: {
        flags: {
          where: { resolved: false },
          orderBy: { created_at: 'desc' },
        },
        images: { orderBy: { sort_order: 'asc' } },
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
            verification_status: true,
            username: true,
          },
        },
        city: true,
        category: true,
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      ...row,
      price: row.price.toString(),
      area_sqm: row.area_sqm?.toString() ?? null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function moderateListing(
  propertyId: string,
  adminId: string,
  input: ModerateListingInput,
) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, deleted_at: null },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.status !== PropertyStatus.PENDING) {
    throw new BadRequestError('Only PENDING listings can be moderated');
  }

  if (input.action === 'REJECT') {
    const updated = await prisma.$transaction(async (tx) => {
      const rejected = await tx.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.REJECTED },
        include: {
          flags: true,
          images: { orderBy: { sort_order: 'asc' } },
        },
      });

      await tx.adminActionLog.create({
        data: {
          admin_id: adminId,
          action: 'LISTING_REJECT',
          target_type: 'Property',
          target_id: propertyId,
          note: input.rejection_reason,
        },
      });

      return rejected;
    });

    return {
      property: {
        ...updated,
        price: updated.price.toString(),
        area_sqm: updated.area_sqm?.toString() ?? null,
      },
    };
  }

  // APPROVE
  const updated = await prisma.$transaction(async (tx) => {
    const approved = await tx.property.update({
      where: { id: propertyId },
      data: { status: PropertyStatus.LIVE },
      include: {
        flags: true,
        images: { orderBy: { sort_order: 'asc' } },
      },
    });

    let thread = await tx.thread.findFirst({
      where: {
        thread_type: ThreadType.LISTING,
        property_id: propertyId,
        AND: [
          { participants: { some: { user_id: property.seller_id } } },
          { participants: { some: { user_id: adminId } } },
        ],
      },
    });

    if (!thread) {
      // Prefer any existing LISTING thread on this property
      thread = await tx.thread.findFirst({
        where: {
          thread_type: ThreadType.LISTING,
          property_id: propertyId,
        },
      });
    }

    if (!thread) {
      thread = await tx.thread.create({
        data: {
          thread_type: ThreadType.LISTING,
          property_id: propertyId,
          participants: {
            create: [
              { user_id: property.seller_id },
              { user_id: adminId },
            ],
          },
        },
      });
    } else {
      await tx.threadParticipant.upsert({
        where: {
          thread_id_user_id: {
            thread_id: thread.id,
            user_id: property.seller_id,
          },
        },
        create: { thread_id: thread.id, user_id: property.seller_id },
        update: {},
      });
      await tx.threadParticipant.upsert({
        where: {
          thread_id_user_id: {
            thread_id: thread.id,
            user_id: adminId,
          },
        },
        create: { thread_id: thread.id, user_id: adminId },
        update: {},
      });
    }

    await tx.message.create({
      data: {
        thread_id: thread.id,
        sender_id: adminId,
        message_type: MessageType.TEXT,
        message_text:
          'Your listing has been approved and is now LIVE on Bete.',
      },
    });

    await tx.adminActionLog.create({
      data: {
        admin_id: adminId,
        action: 'LISTING_APPROVE',
        target_type: 'Property',
        target_id: propertyId,
        note: `thread_id=${thread.id}`,
      },
    });

    return approved;
  });

  return {
    property: {
      ...updated,
      price: updated.price.toString(),
      area_sqm: updated.area_sqm?.toString() ?? null,
    },
  };
}

export async function listPendingVerifications(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = {
    role: UserRole.SELLER,
    verification_status: VerificationStatus.PENDING,
    deleted_at: null,
  };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'asc' },
      include: {
        sellerStats: {
          select: { score: true, total_views: true },
        },
        _count: {
          select: {
            properties: {
              where: { deleted_at: null },
            },
          },
        },
      },
    }),
  ]);

  return {
    items: rows.map((row) => {
      const docs = [row.id_document_url, row.business_license_url].filter(
        Boolean,
      ).length;
      const trustFromDocs = docs * 20;
      const trustFromPhone = row.phone_verified_at ? 15 : 0;
      const trustFromScore = row.sellerStats
        ? Math.min(40, Math.round(row.sellerStats.score))
        : 0;
      const trustScore = Math.min(
        99,
        Math.max(40, trustFromDocs + trustFromPhone + trustFromScore),
      );

      return {
        id: row.id,
        name: row.name,
        username: row.username,
        phone: row.phone,
        email: row.email,
        verification_status: row.verification_status,
        created_at: row.created_at.toISOString(),
        doc_count: Math.max(docs, 1),
        trust_score: trustScore,
        location_text: 'Ethiopia',
        account_type:
          row._count.properties >= 5 ? 'Agency' : 'Individual seller',
        bio:
          row._count.properties > 0
            ? `Seller with ${row._count.properties} listing(s) awaiting verification.`
            : 'Seller account awaiting document verification.',
      };
    }),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function verifySeller(
  userId: string,
  adminId: string,
  input: VerifySellerInput,
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.role !== UserRole.SELLER) {
    throw new BadRequestError('Verification only applies to SELLER accounts');
  }

  if (input.action === 'REJECT') {
    const updated = await prisma.$transaction(async (tx) => {
      const rejected = await tx.user.update({
        where: { id: userId },
        data: {
          verification_status: VerificationStatus.REJECTED,
          verified_at: null,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          verification_status: true,
          verified_at: true,
        },
      });

      await tx.adminActionLog.create({
        data: {
          admin_id: adminId,
          action: 'SELLER_VERIFY_REJECT',
          target_type: 'User',
          target_id: userId,
          note: input.rejection_reason,
        },
      });

      return rejected;
    });

    return { user: updated };
  }

  const username =
    user.username ?? (await generateUniqueUsername(user.name));

  const updated = await prisma.$transaction(async (tx) => {
    const verified = await tx.user.update({
      where: { id: userId },
      data: {
        verification_status: VerificationStatus.VERIFIED,
        verified_at: new Date(),
        username,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        verification_status: true,
        verified_at: true,
      },
    });

    await tx.adminActionLog.create({
      data: {
        admin_id: adminId,
        action: 'SELLER_VERIFY_APPROVE',
        target_type: 'User',
        target_id: userId,
        note: `username=${username}`,
      },
    });

    return verified;
  });

  return { user: updated };
}
