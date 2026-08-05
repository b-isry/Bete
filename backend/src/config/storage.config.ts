import { z } from 'zod';
import './env';

const storageEnvSchema = z.object({
  S3_ENDPOINT: z.string().url('S3_ENDPOINT must be a valid URL'),
  /**
   * Browser-reachable endpoint used only for signing presigned URLs. In docker
   * compose S3_ENDPOINT is `http://minio:9000`, which no browser can resolve.
   * Falls back to S3_ENDPOINT when host and container share a hostname.
   */
  S3_PUBLIC_ENDPOINT: z
    .string()
    .url('S3_PUBLIC_ENDPOINT must be a valid URL')
    .optional(),
  S3_REGION: z.string().min(1, 'S3_REGION is required'),
  S3_ACCESS_KEY_ID: z.string().min(1, 'S3_ACCESS_KEY_ID is required'),
  S3_SECRET_ACCESS_KEY: z.string().min(1, 'S3_SECRET_ACCESS_KEY is required'),
  S3_BUCKET: z.string().min(1, 'S3_BUCKET is required'),
  S3_FORCE_PATH_STYLE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  S3_PUBLIC_URL_BASE: z.string().url('S3_PUBLIC_URL_BASE must be a valid URL'),
});

const parsed = storageEnvSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.flatten().fieldErrors;
  console.error('Invalid storage environment variables:', formatted);
  process.exit(1);
}

export const storageConfig = {
  endpoint: parsed.data.S3_ENDPOINT,
  publicEndpoint: parsed.data.S3_PUBLIC_ENDPOINT ?? parsed.data.S3_ENDPOINT,
  region: parsed.data.S3_REGION,
  accessKeyId: parsed.data.S3_ACCESS_KEY_ID,
  secretAccessKey: parsed.data.S3_SECRET_ACCESS_KEY,
  bucket: parsed.data.S3_BUCKET,
  forcePathStyle: parsed.data.S3_FORCE_PATH_STYLE,
  publicUrlBase: parsed.data.S3_PUBLIC_URL_BASE.replace(/\/$/, ''),
};

export type StorageConfig = typeof storageConfig;
