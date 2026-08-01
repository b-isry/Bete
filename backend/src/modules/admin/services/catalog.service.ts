import { Locale } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { resolveLocale } from '../../../utils/locale';

export async function listUsers(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const where = { deleted_at: null };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        role: true,
        verification_status: true,
        created_at: true,
      },
    }),
  ]);

  return {
    items: rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

export async function listCategories(localeInput?: string) {
  const locale = resolveLocale(localeInput);
  const categories = await prisma.category.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: {
        select: {
          properties: { where: { deleted_at: null } },
        },
      },
    },
  });

  const ids = categories.map((c) => String(c.id));
  const translations = await prisma.translation.findMany({
    where: {
      entity_type: 'CATEGORY',
      entity_id: { in: ids },
      field: 'name',
      locale: { in: [locale, Locale.en] },
    },
  });

  const preferred = new Map<string, string>();
  const english = new Map<string, string>();
  for (const row of translations) {
    if (row.locale === locale) {
      preferred.set(row.entity_id, row.value);
    }
    if (row.locale === Locale.en) {
      english.set(row.entity_id, row.value);
    }
  }

  return {
    items: categories.map((cat) => {
      const id = String(cat.id);
      return {
        id: cat.id,
        slug: cat.slug,
        name: preferred.get(id) ?? english.get(id) ?? cat.slug,
        listing_count: cat._count.properties,
      };
    }),
  };
}
