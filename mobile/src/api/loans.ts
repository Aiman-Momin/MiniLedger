import { Platform } from 'react-native';
import { apiRequest } from './client';

export type LoanStatus = 'repaid' | 'overdue' | 'pending';

export type Loan = {
  id: string;
  friendName: string;
  amount: number;
  dueDate: string;
  status: LoanStatus;
  repaidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
};

export type LoanSummary = {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
  outstanding: number;
  counts: Record<LoanStatus | 'total', number>;
};

export type ReceiptFile = {
  uri: string;
  name: string;
  type: string;
};

export type NewLoan = {
  friendName: string;
  amount: number;
  dueDate: string;
  receipt: ReceiptFile | null;
};

async function toUploadPart(receipt: ReceiptFile): Promise<Blob> {
  if (Platform.OS !== 'web') {
    return receipt as unknown as Blob;
  }
  const blob = await (await fetch(receipt.uri)).blob();
  return new File([blob], receipt.name, { type: receipt.type });
}

export async function fetchLoans() {
  const { loans } = await apiRequest<{ loans: Loan[] }>('/loans');
  return loans;
}

export function fetchSummary() {
  return apiRequest<LoanSummary>('/loans/summary');
}

export async function createLoan({ receipt, ...fields }: NewLoan) {
  let body: object | FormData = fields;

  if (receipt) {
    const form = new FormData();
    form.append('friendName', fields.friendName);
    form.append('amount', String(fields.amount));
    form.append('dueDate', fields.dueDate);
    form.append('receipt', await toUploadPart(receipt));
    body = form;
  }

  const { loan } = await apiRequest<{ loan: Loan }>('/loans', { method: 'POST', body });
  return loan;
}

export async function markLoanRepaid(id: string) {
  const { loan } = await apiRequest<{ loan: Loan }>(`/loans/${id}/repay`, { method: 'PATCH' });
  return loan;
}
