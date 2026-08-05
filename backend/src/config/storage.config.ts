import { z } from 'zod';
import './env';

/** Accepts a valid URL, empty string, or missing value (treat empty as unset). */
const optionalUrl = z
  .string()
  .optional()
  .transform((v) => (v === undefined || v === '' ? '' : v))
  .refine((v) => v === '' || z.string().url().safeParse(v).success, {
    message: 'must be a valid URL',
  });

const optionalString = z.string().optional().default('');

const storageEnvSchema = z.object({
  S3_ENDPOINT: optionalUrl,
  /**
   * Browser-reachable endpoint used only for signing presigned URLs. In docker
   * compose S3_ENDPOINT is `http://minio:9000`, which no browser can resolve.
   * Falls back to S3_ENDPOINT when host and container share a hostname.
   */
  S3_PUBLIC_ENDPOINT: optionalUrl,
  S3_REGION: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_BUCKET: optionalString,
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  S3_PUBLIC_URL_BASE: optionalUrl,
});

const parsed = storageEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  console.warn(
    'Invalid storage environment variables (media storage disabled):',
    formatted,
  );
}

const data = parsed.success
  ? parsed.data
  : {
      S3_ENDPOINT: '',
      S3_PUBLIC_ENDPOINT: '',
      S3_REGION: '',
      S3_ACCESS_KEY_ID: '',
      S3_SECRET_ACCESS_KEY: '',
      S3_BUCKET: '',
      S3_FORCE_PATH_STYLE: true,
      S3_PUBLIC_URL_BASE: '',
    };

/** True when the minimum credentials needed to talk to S3/MinIO are present. */
export const isStorageConfigured = Boolean(
  data.S3_ENDPOINT && data.S3_ACCESS_KEY_ID,
);

if (!isStorageConfigured) {
  console.warn(
    'Media storage is not configured (S3_ENDPOINT / S3_ACCESS_KEY_ID missing). Upload endpoints will return 501.',
  );
}

export const storageConfig = {
  endpoint: data.S3_ENDPOINT,
  publicEndpoint: data.S3_PUBLIC_ENDPOINT || data.S3_ENDPOINT,
  region: data.S3_REGION || 'us-east-1',
  accessKeyId: data.S3_ACCESS_KEY_ID,
  secretAccessKey: data.S3_SECRET_ACCESS_KEY,
  bucket: data.S3_BUCKET,
  forcePathStyle: data.S3_FORCE_PATH_STYLE,
  publicUrlBase: data.S3_PUBLIC_URL_BASE.replace(/\/$/, ''),
};

export type StorageConfig = typeof storageConfig;
