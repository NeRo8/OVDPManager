import { round2 } from './number';

const CURRENCY_SIGNS: Record<string, string> = { UAH: '₴', USD: '$', EUR: '€' };

const numberFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, currency: string): string {
  return `${numberFormat.format(value)} ${CURRENCY_SIGNS[currency] ?? currency}`;
}

/** Short amount with the currency sign, for tight spots: 12,5 тис ₴ */
export function formatCompactMoney(value: number, currency: string): string {
  return `${formatCompact(value)} ${CURRENCY_SIGNS[currency] ?? currency}`;
}

/** Sums amounts per currency: "10 200,00 ₴ + 5 000,00 $". */
export function formatTotals(items: { currency: string; value: number }[]): string {
  const totals = new Map<string, number>();
  for (const { currency, value } of items) {
    totals.set(currency, round2((totals.get(currency) ?? 0) + value));
  }
  return [...totals].map(([currency, value]) => formatMoney(value, currency)).join(' + ');
}

/** Axis-friendly amount: 950, 1,5 тис, 12,5 тис, 1,2 млн */
export function formatCompact(value: number): string {
  const compact = (n: number, unit: string) =>
    `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 }).format(n)} ${unit}`;
  if (value >= 1_000_000) return compact(value / 1_000_000, 'млн');
  if (value >= 1_000) return compact(value / 1_000, 'тис');
  return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(value);
}

export const MONTHS = [
  'Січень',
  'Лютий',
  'Березень',
  'Квітень',
  'Травень',
  'Червень',
  'Липень',
  'Серпень',
  'Вересень',
  'Жовтень',
  'Листопад',
  'Грудень',
];

export const MONTHS_SHORT = [
  'січ',
  'лют',
  'бер',
  'кві',
  'тра',
  'чер',
  'лип',
  'сер',
  'вер',
  'жов',
  'лис',
  'гру',
];

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
