export const MAX_AMOUNT = 10_000_000;
export const MAX_FRIEND_NAME_LENGTH = 60;

export type LoanFormFields = {
  friendName: string;
  amount: string;
  dueDate: string;
};

export type LoanFormErrors = Partial<
  Record<'friendName' | 'amount' | 'dueDate' | 'receipt', string>
>;

export function isValidIndianMobile(digits: string) {
  return /^[6-9]\d{9}$/.test(digits);
}

export function isRealDate(isoDate: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const date = new Date(`${isoDate}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(isoDate);
}

export function validateLoanForm({ friendName, amount, dueDate }: LoanFormFields): LoanFormErrors {
  const errors: LoanFormErrors = {};
  const name = friendName.trim();
  const amountText = amount.trim();

  if (!name) {
    errors.friendName = 'Friend name is required';
  } else if (name.length > MAX_FRIEND_NAME_LENGTH) {
    errors.friendName = `Friend name must be ${MAX_FRIEND_NAME_LENGTH} characters or fewer`;
  }

  if (!amountText) {
    errors.amount = 'Amount is required';
  } else if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
    errors.amount = 'Enter a number with at most 2 decimal places';
  } else if (Number(amountText) <= 0) {
    errors.amount = 'Amount must be greater than 0';
  } else if (Number(amountText) > MAX_AMOUNT) {
    errors.amount = 'Amount cannot be more than 1,00,00,000';
  }

  if (!isRealDate(dueDate)) {
    errors.dueDate = 'Pick a valid due date';
  }

  return errors;
}
