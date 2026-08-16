import { User, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env';
import { prisma } from '../../../config/prisma';
import {
  ConflictError,
  ForbiddenError,
  BadRequestError,
  UnauthorizedError,
} from '../../../errors/app-error';
import {
  LoginInput,
  RegisterInput,
  SubmitVerificationInput,
  UpdateSellerProfileInput,
} from '../schemas/auth.schema';

const BCRYPT_ROUNDS = 10;

const userProfileSelect = {
  id: true,
  name: true,
  username: true,
  phone: true,
  email: true,
  whatsapp_number: true,
  telegram_username: true,
  facebook_url: true,
  bio: true,
  logo_url: true,
  cover_image_url: true,
  primary_city_id: true,
  role: true,
  verification_status: true,
  id_document_url: true,
  business_license_url: true,
  phone_verified_at: true,
  verified_at: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} as const;

export type UserProfile = Pick<
  User,
  keyof typeof userProfileSelect
>;

function signAccessToken(user: {
  id: string;
  role: UserRole;
  verification_status: User['verification_status'];
}): string {
  const payload = {
    id: user.id,
    role: user.role,
    verification_status: user.verification_status,
  };

  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export async function register(data: RegisterInput): Promise<{
  token: string;
  user: UserProfile;
}> {
  const existing = await prisma.user.findFirst({
    where: {
      deleted_at: null,
      OR: [
        { phone: data.phone },
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
    select: { id: true, phone: true, email: true },
  });

  if (existing) {
    if (existing.phone === data.phone) {
      throw new ConflictError('A user with this phone number already exists');
    }
    throw new ConflictError('A user with this email already exists');
  }

  const password_hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const isSeller = data.role === 'SELLER';

  if (isSeller && data.primary_city_id != null) {
    const city = await prisma.city.findUnique({
      where: { id: data.primary_city_id },
      select: { id: true },
    });
    if (!city) {
      throw new BadRequestError('Invalid primary_city_id');
    }
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      password_hash,
      role: isSeller ? UserRole.SELLER : UserRole.USER,
      ...(isSeller && data.primary_city_id != null
        ? { primary_city_id: data.primary_city_id }
        : {}),
      ...(isSeller && data.bio ? { bio: data.bio } : {}),
    },
    select: userProfileSelect,
  });

  const token = signAccessToken(user);

  return { token, user };
}

export async function login(data: LoginInput): Promise<{
  token: string;
  user: UserProfile;
}> {
  const user = await prisma.user.findFirst({
    where: {
      deleted_at: null,
      OR: [
        ...(data.phone ? [{ phone: data.phone }] : []),
        ...(data.email ? [{ email: data.email }] : []),
      ],
    },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
    select: userProfileSelect,
  });

  const token = signAccessToken(updated);

  return { token, user: updated };
}

export async function submitVerification(
  userId: string,
  data: SubmitVerificationInput,
): Promise<UserProfile> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.role !== UserRole.SELLER && user.role !== UserRole.USER) {
    throw new ForbiddenError('Verification is only available for buyers and sellers');
  }

  if (user.phone_verified_at === null) {
    throw new BadRequestError('Verify your phone number first');
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      verification_status: 'PENDING',
      id_document_url: data.id_document_url,
      ...(data.business_license_url !== undefined
        ? { business_license_url: data.business_license_url }
        : {}),
    },
    select: userProfileSelect,
  });
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
    select: userProfileSelect,
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}

export async function updateSellerProfile(
  userId: string,
  data: UpdateSellerProfileInput,
): Promise<UserProfile> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deleted_at: null },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  if (user.role !== UserRole.SELLER) {
    throw new ForbiddenError('Only sellers can update an agency profile');
  }

  if (data.primary_city_id != null) {
    const city = await prisma.city.findUnique({
      where: { id: data.primary_city_id },
      select: { id: true },
    });
    if (!city) {
      throw new BadRequestError('Invalid primary_city_id');
    }
  }

  if (data.email !== undefined && data.email !== null) {
    const clash = await prisma.user.findFirst({
      where: {
        deleted_at: null,
        email: data.email,
        NOT: { id: userId },
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictError('A user with this email already exists');
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
      ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
      ...(data.cover_image_url !== undefined
        ? { cover_image_url: data.cover_image_url }
        : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.whatsapp_number !== undefined
        ? { whatsapp_number: data.whatsapp_number }
        : {}),
      ...(data.telegram_username !== undefined
        ? { telegram_username: data.telegram_username }
        : {}),
      ...(data.facebook_url !== undefined
        ? { facebook_url: data.facebook_url }
        : {}),
      ...(data.primary_city_id !== undefined
        ? { primary_city_id: data.primary_city_id }
        : {}),
    },
    select: userProfileSelect,
  });
}
