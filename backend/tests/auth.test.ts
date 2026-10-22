import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';
import { requestOtp, resetDatabase } from './helpers';

const phone = '+919876543210';

beforeEach(resetDatabase);
afterAll(() => pool.end());

function verify(code: string | undefined) {
  return request(app).post('/auth/verify-otp').send({ phone, code });
}

function wrongCodeFor(code: string | undefined) {
  return code === '000000' ? '111111' : '000000';
}

describe('POST /auth/request-otp', () => {
  it('normalises the phone number and logs a 6-digit code', async () => {
    const { response, code } = await requestOtp('98765 43210');

    expect(response.status).toBe(200);
    expect(response.body.phone).toBe(phone);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('rejects an invalid phone number', async () => {
    const { response } = await requestOtp('12345');

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('phone');
  });

  it('does not issue a second code within 30 seconds', async () => {
    await requestOtp(phone);
    const { response } = await requestOtp(phone);

    expect(response.status).toBe(429);
    expect(response.body.error.details.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe('POST /auth/verify-otp', () => {
  it('returns a token and creates the user on first login', async () => {
    const { code } = await requestOtp(phone);
    const response = await verify(code);

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({ id: expect.any(String), phone });
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const { code } = await requestOtp(phone);
    const response = await verify(wrongCodeFor(code));

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      message: 'Incorrect code',
      details: { attemptsLeft: 4 },
    });
  });

  it('blocks the code after 5 wrong attempts', async () => {
    const { code } = await requestOtp(phone);
    for (let attempt = 0; attempt < 5; attempt++) {
      await verify(wrongCodeFor(code));
    }
    const response = await verify(code);

    expect(response.status).toBe(429);
  });

  it('rejects an expired code', async () => {
    const { code } = await requestOtp(phone);
    await pool.query("UPDATE otps SET expires_at = now() - interval '1 second' WHERE phone = $1", [
      phone,
    ]);
    const response = await verify(code);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toMatch(/expired/);
  });

  it('does not accept the same code twice', async () => {
    const { code } = await requestOtp(phone);
    await verify(code);
    const response = await verify(code);

    expect(response.status).toBe(400);
  });
});
