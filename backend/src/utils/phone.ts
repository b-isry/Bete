import { BadRequestError } from '../errors/app-error';

/** Ethiopian mobile: +251 or 0, then 9 or 7, then 8 digits */
export const ETHIOPIAN_PHONE_REGEX = /^(?:\+251|0)(9|7)\d{8}$/;

export function isValidEthiopianPhone(phone: string): boolean {
  return ETHIOPIAN_PHONE_REGEX.test(phone);
}

export function assertEthiopianPhone(phone: string): void {
  if (!isValidEthiopianPhone(phone)) {
    throw new BadRequestError(
      'Invalid Ethiopian phone number. Expected format: +2519XXXXXXXX, +2517XXXXXXXX, 09XXXXXXXX, or 07XXXXXXXX',
    );
  }
}
