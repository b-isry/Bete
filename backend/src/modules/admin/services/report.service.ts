import { PropertyStatus, ReportReason, ReportStatus } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../errors/app-error';

/**
 * Creates a report and auto-hides the listing when PENDING reports reach 3+.
 * Auto-hide runs in the same transaction as the insert.
 */
export async function createReport(
  propertyId: string,
  userId: string,
  reason: ReportReason,
  note?: string,
) {
  const property = await prisma.property.findFirst({
    where: { id: propertyId, deleted_at: null },
    select: { id: true, seller_id: true, status: true },
  });

  if (!property) {
    throw new NotFoundError('Property not found');
  }

  if (property.seller_id === userId) {
    throw new ForbiddenError('You cannot report your own listing');
  }

  return prisma.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        property_id: propertyId,
        reported_by: userId,
        reason,
        note,
        status: ReportStatus.PENDING,
      },
    });

    const pendingCount = await tx.report.count({
      where: {
        property_id: propertyId,
        status: ReportStatus.PENDING,
      },
    });

    if (
      pendingCount >= 3 &&
      property.status !== PropertyStatus.AUTO_HIDDEN &&
      property.status !== PropertyStatus.REMOVED
    ) {
      await tx.property.update({
        where: { id: propertyId },
        data: { status: PropertyStatus.AUTO_HIDDEN },
      });
    }

    return { report, pendingCount, autoHidden: pendingCount >= 3 };
  });
}

export async function listReportQueue(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const autoHidden = await prisma.property.findMany({
    where: {
      deleted_at: null,
      OR: [
        { status: PropertyStatus.AUTO_HIDDEN },
        {
          reports: {
            some: { status: ReportStatus.PENDING },
          },
        },
      ],
    },
    include: {
      reports: {
        where: { status: ReportStatus.PENDING },
        orderBy: { created_at: 'desc' },
        include: {
          reporter: {
            select: { id: true, name: true, phone: true },
          },
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          verification_status: true,
        },
      },
      images: {
        orderBy: { sort_order: 'asc' },
        take: 1,
      },
      _count: {
        select: {
          reports: { where: { status: ReportStatus.PENDING } },
        },
      },
    },
    orderBy: { updated_at: 'desc' },
  });

  const filtered = autoHidden.filter(
    (property) =>
      property.status === PropertyStatus.AUTO_HIDDEN ||
      property._count.reports >= 3,
  );

  const total = filtered.length;
  const items = filtered.slice(skip, skip + limit).map((property) => ({
    ...property,
    price: property.price.toString(),
    area_sqm: property.area_sqm?.toString() ?? null,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  status: 'RESOLVED' | 'DISMISSED',
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { property: true },
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== ReportStatus.PENDING) {
    throw new BadRequestError('Report is already resolved');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: { status },
    });

    const pendingRemaining = await tx.report.count({
      where: {
        property_id: report.property_id,
        status: ReportStatus.PENDING,
      },
    });

    let propertyRestored = false;
    if (
      pendingRemaining === 0 &&
      report.property.status === PropertyStatus.AUTO_HIDDEN &&
      report.property.deleted_at === null
    ) {
      await tx.property.update({
        where: { id: report.property_id },
        data: { status: PropertyStatus.LIVE },
      });
      propertyRestored = true;
    }

    await tx.adminActionLog.create({
      data: {
        admin_id: adminId,
        action: `REPORT_${status}`,
        target_type: 'Report',
        target_id: reportId,
        note: `property_id=${report.property_id}; restored=${propertyRestored}`,
      },
    });

    return { report: updated, propertyRestored };
  });
}
