import fs from 'node:fs/promises';
import { Router, type Request } from 'express';
import { z } from 'zod';
import { HttpError } from '../errors';
import { receiptUpload } from '../middleware/receiptUpload';
import { requireAuth } from '../middleware/requireAuth';
import {
  type LoanRow,
  insertLoan,
  listLoans,
  loanExists,
  markRepaid,
  summarizeLoans,
} from './queries';
import { createLoanSchema } from './schemas';

const toRupees = (paise: number) => paise / 100;

function toLoanResponse(req: Request, loan: LoanRow) {
  return {
    id: loan.id,
    friendName: loan.friend_name,
    amount: toRupees(loan.amount_paise),
    dueDate: loan.due_date,
    status: loan.status,
    repaidAt: loan.repaid_at,
    receiptUrl: loan.receipt_path
      ? `${req.protocol}://${req.get('host')}/uploads/${loan.receipt_path}`
      : null,
    createdAt: loan.created_at,
  };
}

export const loansRouter = Router();

loansRouter.use(requireAuth);

loansRouter.get('/', async (req, res) => {
  const loans = await listLoans(req.userId);
  res.json({ loans: loans.map((loan) => toLoanResponse(req, loan)) });
});

loansRouter.get('/summary', async (req, res) => {
  const summary = await summarizeLoans(req.userId);
  res.json({
    totalLent: toRupees(summary.total_lent),
    totalRepaid: toRupees(summary.total_repaid),
    overdueAmount: toRupees(summary.overdue_amount),
    outstanding: toRupees(summary.total_lent - summary.total_repaid),
    counts: {
      total: summary.total_count,
      repaid: summary.repaid_count,
      overdue: summary.overdue_count,
      pending: summary.total_count - summary.repaid_count - summary.overdue_count,
    },
  });
});

loansRouter.post('/', receiptUpload, async (req, res) => {
  const parsed = createLoanSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    if (req.file) await fs.rm(req.file.path, { force: true });
    throw parsed.error;
  }

  const loan = await insertLoan(req.userId, parsed.data, req.file?.filename ?? null);
  res.status(201).json({ loan: toLoanResponse(req, loan) });
});

loansRouter.patch('/:id/repay', async (req, res) => {
  const loanId = z.uuid().safeParse(req.params.id);
  if (!loanId.success) {
    throw new HttpError(404, 'Loan not found');
  }

  const loan = await markRepaid(req.userId, loanId.data);
  if (!loan) {
    const exists = await loanExists(req.userId, loanId.data);
    throw exists
      ? new HttpError(409, 'This loan is already marked as repaid')
      : new HttpError(404, 'Loan not found');
  }

  res.json({ loan: toLoanResponse(req, loan) });
});
