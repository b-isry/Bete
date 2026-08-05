import { UserRole } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../../config/prisma';
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from '../../../errors/app-error';
import { sendSuccess } from '../../../utils/response';
import { PresignUploadInput } from '../schemas/storage.schema';
import * as storageService from '../services/storage.service';

export async function presignUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const body = req.body as PresignUploadInput;
    const { category, contentType, fileExtension, thread_id } = body;

    if (category === 'PROPERTY_IMAGE' || category === 'ID_DOCUMENT') {
      if (req.user.role !== UserRole.SELLER) {
        throw new ForbiddenError(
          'Only sellers can upload property images or ID documents',
        );
      }
    }

    if (category === 'MESSAGE_MEDIA') {
      if (!thread_id) {
        throw new BadRequestError(
          'thread_id is required when category is MESSAGE_MEDIA',
        );
      }

      const participant = await prisma.threadParticipant.findUnique({
        where: {
          thread_id_user_id: {
            thread_id,
            user_id: req.user.id,
          },
        },
        select: { id: true },
      });

      if (!participant) {
        throw new ForbiddenError(
          'You must be a participant of the thread to upload message media',
        );
      }
    }

    const result = await storageService.createPresignedUploadUrl(
      category,
      req.user.id,
      contentType,
      fileExtension,
    );

    sendSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}
