import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { storageConfig } from '../../../config/storage.config';
import { BadRequestError } from '../../../errors/app-error';
import { UploadCategory } from '../schemas/storage.schema';

type CategoryConfig = {
  prefix: 'public' | 'private';
  allowedContentTypes: readonly string[];
  maxSizeBytes: number;
};

export const CATEGORY_CONFIG: Record<UploadCategory, CategoryConfig> = {
  PROPERTY_IMAGE: {
    prefix: 'public',
    allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 8_388_608, // 8MB
  },
  ID_DOCUMENT: {
    prefix: 'private',
    allowedContentTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    maxSizeBytes: 10_485_760, // 10MB
  },
  MESSAGE_MEDIA: {
    prefix: 'private',
    allowedContentTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mpeg',
      'audio/ogg',
      'audio/webm',
      'video/mp4',
      'video/webm',
    ],
    maxSizeBytes: 26_214_400, // 25MB
  },
};

const UPLOAD_URL_EXPIRES_IN = 5 * 60; // 5 minutes
const READ_URL_EXPIRES_IN = 10 * 60; // 10 minutes

const clientOptions = {
  region: storageConfig.region,
  credentials: {
    accessKeyId: storageConfig.accessKeyId,
    secretAccessKey: storageConfig.secretAccessKey,
  },
  forcePathStyle: storageConfig.forcePathStyle,
};

/** Server-to-storage calls (delete, future reads) over the internal network. */
const s3Client = new S3Client({
  ...clientOptions,
  endpoint: storageConfig.endpoint,
});

/**
 * Signs URLs against the browser-reachable host. SigV4 covers the Host header,
 * so a URL signed for `minio:9000` fails when the browser sends it to
 * `localhost:9000` — sign with the public endpoint instead.
 */
const presignClient = new S3Client({
  ...clientOptions,
  endpoint: storageConfig.publicEndpoint,
});

export type PresignedUploadResult = {
  uploadUrl: string;
  key: string;
  publicUrl: string | null;
};

export async function createPresignedUploadUrl(
  category: UploadCategory,
  ownerId: string,
  contentType: string,
  fileExtension: string,
): Promise<PresignedUploadResult> {
  const config = CATEGORY_CONFIG[category];

  if (!config.allowedContentTypes.includes(contentType)) {
    throw new BadRequestError(
      `contentType '${contentType}' is not allowed for category ${category}`,
      { allowedContentTypes: config.allowedContentTypes },
    );
  }

  const key = `${config.prefix}/${category.toLowerCase()}/${ownerId}/${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(presignClient, command, {
    expiresIn: UPLOAD_URL_EXPIRES_IN,
  });

  const publicUrl =
    config.prefix === 'public'
      ? `${storageConfig.publicUrlBase}/${key.replace(/^public\//, '')}`
      : null;

  return { uploadUrl, key, publicUrl };
}

export async function getPresignedReadUrl(key: string): Promise<string> {
  if (!key.startsWith('private/')) {
    throw new BadRequestError(
      'Presigned read URLs are only available for private object keys',
    );
  }

  const command = new GetObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
  });

  return getSignedUrl(presignClient, command, {
    expiresIn: READ_URL_EXPIRES_IN,
  });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: storageConfig.bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Resolve a stored object key to a short-lived GET URL when private.
 * Public keys / absolute URLs are returned unchanged.
 */
export async function resolveReadableUrl(
  value: string | null | undefined,
): Promise<string | null> {
  if (!value) {
    return null;
  }

  if (value.startsWith('private/')) {
    return getPresignedReadUrl(value);
  }

  return value;
}
