import { Router } from 'express';
import { z } from 'zod';
import { OTP_TTL_SECONDS, RESEND_COOLDOWN_SECONDS, issueOtp, verifyOtp } from './otp';
import { phoneSchema } from './phone';
import { signToken } from './token';

const requestOtpSchema = z.object({ phone: phoneSchema });

const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string({ error: 'Code is required' }).regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export const authRouter = Router();

authRouter.post('/request-otp', async (req, res) => {
  const { phone } = requestOtpSchema.parse(req.body);
  await issueOtp(phone);
  res.json({
    phone,
    expiresInSeconds: OTP_TTL_SECONDS,
    resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
  });
});

authRouter.post('/verify-otp', async (req, res) => {
  const { phone, code } = verifyOtpSchema.parse(req.body);
  const user = await verifyOtp(phone, code);
  res.json({ token: signToken(user.id), user });
});
