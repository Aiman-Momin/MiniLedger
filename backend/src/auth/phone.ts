import { z } from 'zod';

const INDIAN_MOBILE = /^(?:\+91)?([6-9]\d{9})$/;

export const phoneSchema = z
  .string({ error: 'Phone number is required' })
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(INDIAN_MOBILE, 'Enter a valid 10-digit Indian mobile number'))
  .transform((value) => `+91${value.slice(-10)}`);
