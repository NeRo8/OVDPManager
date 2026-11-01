import { round2 } from './number';

const CURRENCY_SIGNS: Record<string, string> = { UAH: '₴', USD: '$', EUR: '€' };

const numberFormat = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₴, $, €; the code itself for any other currency. */
export function currencySign(currency: string): string {
  return CURRENCY_SIGNS[currency] ?? currency;
}

/** A rate or percentage-point value with Ukrainian punctuation. */
export function formatRateNumber(value: number): string {
  return String(value).replace('-', '−').replace('.', ',');
}

/** An amount without its currency, for tables whose heading names it: 10 200,50 */
export function formatAmount(value: number): string {
  return numberFormat.format(value);
}

export function formatMoney(value: number, currency: string): string {
  return `${formatAmount(value)} ${currencySign(currency)}`;
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

/** Ukrainian plural form: 1 купівля, 2 купівлі, 5 купівель. */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

/** A single separator followed by three digits could mean decimals or thousands. */
export function isAmbiguousAmount(text: string): boolean {
  return /^[1-9]\d{0,2}[.,]\d{3}$/.test(text.replace(/\s/g, ''));
}

/** Parses a decimal comma or point, and grouped input such as "1,000.50". */
export function parseAmount(text: string): number {
  const input = text.replace(/\s/g, '');
  if (!input) return NaN;
  if (/^[+-]?\d{1,3}(,\d{3})+\.\d+$/.test(input)) return Number(input.replace(/,/g, ''));
  if (/^[+-]?\d{1,3}(\.\d{3})+,\d+$/.test(input))
    return Number(input.replace(/\./g, '').replace(',', '.'));
  if (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(input)) return NaN;
  return Number(input.replace(',', '.'));
}
