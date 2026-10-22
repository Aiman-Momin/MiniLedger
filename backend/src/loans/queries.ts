import { pool } from '../db';
import type { CreateLoanInput } from './schemas';

export type LoanStatus = 'repaid' | 'overdue' | 'pending';

export type LoanRow = {
  id: string;
  friend_name: string;
  amount_paise: number;
  due_date: string;
  repaid_at: Date | null;
  receipt_path: string | null;
  created_at: Date;
  status: LoanStatus;
};

type SummaryRow = {
  total_lent: number;
  total_repaid: number;
  overdue_amount: number;
  total_count: number;
  repaid_count: number;
  overdue_count: number;
};

const LOAN_COLUMNS = `
  id, friend_name, amount_paise, due_date, repaid_at, receipt_path, created_at,
  CASE
    WHEN repaid_at IS NOT NULL THEN 'repaid'
    WHEN due_date < CURRENT_DATE THEN 'overdue'
    ELSE 'pending'
  END AS status
`;

export async function listLoans(userId: string): Promise<LoanRow[]> {
  const { rows } = await pool.query<LoanRow>(
    `SELECT ${LOAN_COLUMNS} FROM loans WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function insertLoan(
  userId: string,
  input: CreateLoanInput,
  receiptPath: string | null,
): Promise<LoanRow> {
  const { rows } = await pool.query<LoanRow>(
    `INSERT INTO loans (user_id, friend_name, amount_paise, due_date, receipt_path)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${LOAN_COLUMNS}`,
    [userId, input.friendName, Math.round(input.amount * 100), input.dueDate, receiptPath],
  );
  return rows[0];
}

export async function markRepaid(userId: string, loanId: string): Promise<LoanRow | null> {
  const { rows } = await pool.query<LoanRow>(
    `UPDATE loans SET repaid_at = now()
     WHERE id = $1 AND user_id = $2 AND repaid_at IS NULL
     RETURNING ${LOAN_COLUMNS}`,
    [loanId, userId],
  );
  return rows[0] ?? null;
}

export async function loanExists(userId: string, loanId: string): Promise<boolean> {
  const { rowCount } = await pool.query('SELECT 1 FROM loans WHERE id = $1 AND user_id = $2', [
    loanId,
    userId,
  ]);
  return rowCount === 1;
}

export async function summarizeLoans(userId: string): Promise<SummaryRow> {
  const { rows } = await pool.query<SummaryRow>(
    `SELECT
       COALESCE(SUM(amount_paise), 0) AS total_lent,
       COALESCE(SUM(amount_paise) FILTER (WHERE repaid_at IS NOT NULL), 0) AS total_repaid,
       COALESCE(SUM(amount_paise) FILTER (WHERE repaid_at IS NULL AND due_date < CURRENT_DATE), 0)
         AS overdue_amount,
       COUNT(*) AS total_count,
       COUNT(*) FILTER (WHERE repaid_at IS NOT NULL) AS repaid_count,
       COUNT(*) FILTER (WHERE repaid_at IS NULL AND due_date < CURRENT_DATE) AS overdue_count
     FROM loans
     WHERE user_id = $1`,
    [userId],
  );
  return rows[0];
}
