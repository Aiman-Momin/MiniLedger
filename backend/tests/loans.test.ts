import fs from 'node:fs/promises';
import path from 'node:path';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';
import { uploadsDir } from '../src/middleware/receiptUpload';
import { dateFromToday, logIn, resetDatabase } from './helpers';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

let token: string;

beforeEach(async () => {
  await resetDatabase();
  token = await logIn('9876543210');
});
afterAll(() => pool.end());

function createLoan(body: object, authToken = token) {
  return request(app).post('/loans').set('Authorization', `Bearer ${authToken}`).send(body);
}

function repay(loanId: string, authToken = token) {
  return request(app).patch(`/loans/${loanId}/repay`).set('Authorization', `Bearer ${authToken}`);
}

describe('POST /loans', () => {
  it('requires a valid token', async () => {
    const response = await request(app).post('/loans').set('Authorization', 'Bearer nope');

    expect(response.status).toBe(401);
  });

  it('creates a loan from JSON', async () => {
    const dueDate = await dateFromToday(10);
    const response = await createLoan({ friendName: '  Rahul  ', amount: 1500.5, dueDate });

    expect(response.status).toBe(201);
    expect(response.body.loan).toMatchObject({
      friendName: 'Rahul',
      amount: 1500.5,
      dueDate,
      status: 'pending',
      repaidAt: null,
      receiptUrl: null,
    });
  });

  it('creates a loan with a receipt image and serves the file', async () => {
    const response = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .field('friendName', 'Priya')
      .field('amount', '250')
      .field('dueDate', await dateFromToday(3))
      .attach('receipt', tinyPng, { filename: 'receipt.png', contentType: 'image/png' });

    expect(response.status).toBe(201);
    expect(response.body.loan.amount).toBe(250);

    const receiptPath = new URL(response.body.loan.receiptUrl).pathname;
    const receipt = await request(app).get(receiptPath);
    expect(receipt.status).toBe(200);
    expect(receipt.headers['content-type']).toBe('image/png');

    await fs.rm(path.join(uploadsDir, path.basename(receiptPath)));
  });

  it('rejects a receipt that is not an image', async () => {
    const response = await request(app)
      .post('/loans')
      .set('Authorization', `Bearer ${token}`)
      .field('friendName', 'Priya')
      .field('amount', '250')
      .field('dueDate', '2030-01-01')
      .attach('receipt', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
  });

  it.each([
    [
      'an empty friend name',
      { friendName: '   ', amount: 100, dueDate: '2030-01-01' },
      'friendName',
    ],
    ['a negative amount', { friendName: 'Rahul', amount: -5, dueDate: '2030-01-01' }, 'amount'],
    ['3 decimal places', { friendName: 'Rahul', amount: 10.123, dueDate: '2030-01-01' }, 'amount'],
    ['an impossible date', { friendName: 'Rahul', amount: 100, dueDate: '2030-02-30' }, 'dueDate'],
  ])('rejects %s', async (_label, body, field) => {
    const response = await createLoan(body);

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
      field,
    ]);
  });
});

describe('GET /loans', () => {
  it('lists only the current user loans, newest first', async () => {
    const otherToken = await logIn('9123456789');
    await createLoan({ friendName: 'First', amount: 100, dueDate: '2030-01-01' });
    await createLoan({ friendName: 'Second', amount: 200, dueDate: '2030-01-01' });
    await createLoan({ friendName: 'Not mine', amount: 300, dueDate: '2030-01-01' }, otherToken);

    const response = await request(app).get('/loans').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.loans.map((loan: { friendName: string }) => loan.friendName)).toEqual([
      'Second',
      'First',
    ]);
  });
});

describe('PATCH /loans/:id/repay', () => {
  it('marks a loan as repaid and refuses to do it twice', async () => {
    const created = await createLoan({ friendName: 'Rahul', amount: 100, dueDate: '2030-01-01' });

    const first = await repay(created.body.loan.id);
    expect(first.status).toBe(200);
    expect(first.body.loan.status).toBe('repaid');
    expect(first.body.loan.repaidAt).toEqual(expect.any(String));

    const second = await repay(created.body.loan.id);
    expect(second.status).toBe(409);
  });

  it('returns 404 for a loan that belongs to someone else', async () => {
    const otherToken = await logIn('9123456789');
    const created = await createLoan(
      { friendName: 'Rahul', amount: 100, dueDate: '2030-01-01' },
      otherToken,
    );

    const response = await repay(created.body.loan.id);

    expect(response.status).toBe(404);
  });
});
