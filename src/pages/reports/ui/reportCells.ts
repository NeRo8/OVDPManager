import { CURRENCY_NAMES, type Currency } from '@/entities/portfolio';

import { currencySign, formatAmount } from '@/shared/lib';

import type { Flows } from '../model/periodReport';

/** An amount in a table whose title names the currency; a dash for none. */
export const amountCell = (value: number) => (value ? formatAmount(value) : '—');

/** A change in percent with its sign: +12%, −5%; a dash when there is nothing to compare. */
export const changeCell = (change: number | null) => {
  if (change === null) return '—';
  const rounded = Math.round(change);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}%`;
};

/** A share in whole percent; one that rounds to zero still shows it is there. */
export const shareCell = (share: number) => (share < 0.5 ? '<1%' : `${Math.round(share)}%`);

/** A difference of rates in percentage points with its sign: +1.3 п.п., −0.4 п.п. */
export const pointsCell = (difference: number) => {
  const rounded = Math.round(difference * 10) / 10;
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)} п.п.`;
};

export const FLOW_COLUMNS = ['Купівлі', 'Купони', 'Погашення'];

export const flowCells = ({ invested, coupons, redemptions }: Flows) => [
  amountCell(invested),
  amountCell(coupons),
  amountCell(redemptions),
];

/** «По місяцях · Гривня, ₴» */
export const tableTitle = (title: string, currency: Currency) =>
  `${title} · ${CURRENCY_NAMES[currency]}, ${currencySign(currency)}`;
