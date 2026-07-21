import { createHash } from 'crypto';

/**
 * Sole source of visitor_key for analytics deduplication.
 * Hash = SHA-256(ip + userAgent + dailySalt) where dailySalt is the current UTC date (YYYY-MM-DD).
 */
export function hashVisitorKey(ip: string, userAgent: string): string {
  const dailySalt = new Date().toISOString().slice(0, 10);
  return createHash('sha256')
    .update(`${ip}${userAgent}${dailySalt}`)
    .digest('hex');
}
