import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';

export async function resetDatabase() {
  await pool.query('TRUNCATE loans, otps, users');
}

export async function requestOtp(phone: string) {
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  const response = await request(app).post('/auth/request-otp').send({ phone });
  const otpLine = log.mock.calls
    .map(([line]) => String(line))
    .find((line) => line.startsWith('[otp]'));
  log.mockRestore();
  return { response, code: otpLine?.split(' -> ')[1] };
}

export async function logIn(phone: string): Promise<string> {
  const { code } = await requestOtp(phone);
  const response = await request(app).post('/auth/verify-otp').send({ phone, code });
  return response.body.token;
}

export async function dateFromToday(days: number): Promise<string> {
  const { rows } = await pool.query<{ date: string }>(
    'SELECT (CURRENT_DATE + $1::int)::text AS date',
    [days],
  );
  return rows[0].date;
}
