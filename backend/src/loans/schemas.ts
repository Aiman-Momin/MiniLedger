import { z } from 'zod';

export const MAX_AMOUNT_RUPEES = 10_000_000;

function hasAtMostTwoDecimals(value: number): boolean {
  const paise = value * 100;
  return Math.abs(paise - Math.round(paise)) < 1e-6;
}

const amountSchema = z
  .union(
    [
      z.number(),
      z
        .string()
        .trim()
        .regex(/^\d+(\.\d+)?$/)
        .transform(Number),
    ],
    {
      error: 'Amount must be a number',
    },
  )
  .pipe(
    z
      .number()
      .positive('Amount must be greater than 0')
      .max(MAX_AMOUNT_RUPEES, 'Amount cannot be more than 1,00,00,000')
      .refine(hasAtMostTwoDecimals, 'Amount can have at most 2 decimal places'),
  );

export const createLoanSchema = z.object({
  friendName: z
    .string({ error: 'Friend name is required' })
    .trim()
    .min(1, 'Friend name is required')
    .max(60, 'Friend name must be 60 characters or fewer'),
  amount: amountSchema,
  dueDate: z.iso.date({ error: 'Due date must be a valid date in YYYY-MM-DD format' }),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
