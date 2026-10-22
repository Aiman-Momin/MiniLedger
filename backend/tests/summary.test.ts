import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';
import { dateFromToday, logIn, resetDatabase } from './helpers';

let token: string;

beforeEach(async () => {
  await resetDatabase();
  token = await logIn('9876543210');
});
afterAll(() => pool.end());

async function createLoan(friendName: string, amount: number, dueInDays: number) {
  const response = await request(app)
    .post('/loans')
    .set('Authorization', `Bearer ${token}`)
    .send({ friendName, amount, dueDate: await dateFromToday(dueInDays) });
  return response.body.loan.id as string;
}

function getSummary() {
  return request(app).get('/loans/summary').set('Authorization', `Bearer ${token}`);
}

describe('GET /loans/summary', () => {
  it('returns zeros when there are no loans', async () => {
    const response = await getSummary();

    expect(response.body).toEqual({
      totalLent: 0,
      totalRepaid: 0,
      overdueAmount: 0,
      outstanding: 0,
      counts: { total: 0, repaid: 0, overdue: 0, pending: 0 },
    });
  });

  it('splits loans into repaid, overdue and pending', async () => {
    await createLoan('Due next week', 1000, 7);
    await createLoan('Due today', 99.99, 0);
    await createLoan('Overdue', 250.5, -1);
    const repaidId = await createLoan('Repaid late', 300, -5);
    await request(app).patch(`/loans/${repaidId}/repay`).set('Authorization', `Bearer ${token}`);

    const response = await getSummary();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      totalLent: 1650.49,
      totalRepaid: 300,
      overdueAmount: 250.5,
      outstanding: 1350.49,
      counts: { total: 4, repaid: 1, overdue: 1, pending: 2 },
    });
  });
});
