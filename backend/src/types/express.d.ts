import { UserRole, VerificationStatus } from '@prisma/client';

export interface AuthUserPayload {
  id: string;
  role: UserRole;
  verification_status: VerificationStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export {};
