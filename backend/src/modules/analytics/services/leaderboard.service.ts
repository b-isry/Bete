import { Locale } from '@prisma/client';
import { prisma } from '../../../config/prisma';
import { formatSellerStatLine } from '../../../utils/locale-format';
import { resolveLocale } from '../../../utils/locale';

export async function getTopSellers(localeHint?: string | null, limit = 10) {
  const locale: Locale = resolveLocale(localeHint ?? undefined);

  const rows = await prisma.sellerStats.findMany({
    orderBy: [{ rank: 'asc' }, { score: 'desc' }],
    take: limit,
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          verification_status: true,
          deleted_at: true,
        },
      },
    },
  });

  return rows
    .filter((row) => row.seller.deleted_at === null)
    .map((row) => ({
      seller_id: row.seller.id,
      name: row.seller.name,
      username: row.seller.username,
      verification_status: row.seller.verification_status,
      score: row.score,
      rank: row.rank,
      total_views: row.total_views,
      total_contacts: row.total_contacts,
      response_rate: row.response_rate,
      stat_line: formatSellerStatLine({
        locale,
        score: row.score,
        views: row.total_views,
        contacts: row.total_contacts,
      }),
    }));
}
