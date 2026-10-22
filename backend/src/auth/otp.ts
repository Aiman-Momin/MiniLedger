import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { config } from '../config';
import { pool } from '../db';
import { HttpError } from '../errors';

export const OTP_TTL_SECONDS = 5 * 60;
export const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;

type OtpRow = {
  id: string;
  code_hash: string;
  attempts: number;
  expired: boolean;
  consumed: boolean;
};

export type User = {
  id: string;
  phone: string;
  createdAt: string;
};

function hashCode(phone: string, code: string): string {
  return createHmac('sha256', config.jwtSecret).update(`${phone}:${code}`).digest('hex');
}

function codeMatches(otp: OtpRow, phone: string, code: string): boolean {
  const expected = Buffer.from(otp.code_hash, 'hex');
  const actual = Buffer.from(hashCode(phone, code), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function issueOtp(phone: string): Promise<void> {
  const { rows: recent } = await pool.query<{ seconds_ago: number }>(
    `SELECT EXTRACT(EPOCH FROM now() - created_at)::float AS seconds_ago
     FROM otps
     WHERE phone = $1 AND created_at > now() - make_interval(secs => $2)
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone, RESEND_COOLDOWN_SECONDS],
  );

  if (recent.length > 0) {
    const retryAfterSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - recent[0].seconds_ago);
    throw new HttpError(429, `Please wait ${retryAfterSeconds}s before requesting a new code`, {
      retryAfterSeconds,
    });
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await pool.query(
    `INSERT INTO otps (phone, code_hash, expires_at)
     VALUES ($1, $2, now() + make_interval(secs => $3))`,
    [phone, hashCode(phone, code), OTP_TTL_SECONDS],
  );

  console.log(`[otp] ${phone} -> ${code}`);
}

export async function verifyOtp(phone: string, code: string): Promise<User> {
  const { rows } = await pool.query<OtpRow>(
    `SELECT id, code_hash, attempts, expires_at <= now() AS expired, consumed_at IS NOT NULL AS consumed
     FROM otps
     WHERE phone = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [phone],
  );
  const otp = rows[0];

  if (!otp || otp.consumed) {
    throw new HttpError(400, 'No active code for this number, request a new one');
  }
  if (otp.expired) {
    throw new HttpError(400, 'Code has expired, request a new one');
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many incorrect attempts, request a new code');
  }

  if (!codeMatches(otp, phone, code)) {
    const { rows: updated } = await pool.query<{ attempts: number }>(
      'UPDATE otps SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts',
      [otp.id],
    );
    const attemptsLeft = Math.max(MAX_ATTEMPTS - updated[0].attempts, 0);
    throw new HttpError(400, 'Incorrect code', { attemptsLeft });
  }

  const consumed = await pool.query(
    'UPDATE otps SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL',
    [otp.id],
  );
  if (consumed.rowCount === 0) {
    throw new HttpError(400, 'No active code for this number, request a new one');
  }

  const { rows: users } = await pool.query<User>(
    `INSERT INTO users (phone) VALUES ($1)
     ON CONFLICT (phone) DO UPDATE SET phone = EXCLUDED.phone
     RETURNING id, phone, created_at AS "createdAt"`,
    [phone],
  );
  return users[0];
}
