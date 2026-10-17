const CURRENCY_SIGNS: Record<string, string> = { UAH: '₴', USD: '$', EUR: '€' };

const numberFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, currency: string): string {
  return `${numberFormat.format(value)} ${CURRENCY_SIGNS[currency] ?? currency}`;
}

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function formatDaysLeft(days: number): string {
  if (days === 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  return `через ${days} ${plural(days, 'день', 'дні', 'днів')}`;
}

/** Ukrainian plural form: 1 покупка, 2 покупки, 5 покупок. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** Parses user input like "10 000,50" into a number. */
export function parseAmount(text: string): number {
  const normalized = text.replace(/[\s ]/g, '').replace(',', '.');
  return normalized === '' ? NaN : Number(normalized);
}
