const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_MS = 24 * 60 * 60 * 1000;

const wholeAmount = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const amountWithPaise = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(amount: number) {
  return Number.isInteger(amount) ? wholeAmount.format(amount) : amountWithPaise.format(amount);
}

export function formatRupees(amount: number) {
  return `₹${formatAmount(amount)}`;
}

export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const label = `${day} ${MONTHS[month - 1]}`;
  return year === new Date().getFullYear() ? label : `${label} ${year}`;
}

export function formatTimestamp(timestamp: string) {
  return formatDate(toIsoDate(new Date(timestamp)));
}

export function daysUntil(isoDate: string) {
  const today = fromIsoDate(toIsoDate(new Date()));
  return Math.round((fromIsoDate(isoDate).getTime() - today.getTime()) / DAY_MS);
}

export function describeDueDate(isoDate: string) {
  const days = daysUntil(isoDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (days === -1) return 'Was due yesterday, so it will show as overdue';
  return `Was due ${-days} days ago, so it will show as overdue`;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/^\+91/, '');
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}
