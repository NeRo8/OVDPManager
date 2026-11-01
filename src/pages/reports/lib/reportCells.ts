import { CURRENCY_NAMES, type Currency } from '@/entities/portfolio';

import { MONTHS_SHORT, currencySign, formatAmount, signPrefix } from '@/shared/lib';

import type { Flows } from '../model/periodReport';

/** An amount in a table whose title names the currency; a dash for none. */
export const amountCell = (value: number) => (value ? formatAmount(value) : '—');

/** A change in percent with its sign: +12%, −5%; a dash when there is nothing to compare. */
export const changeCell = (change: number | null) => {
  if (change === null) return '—';
  const rounded = Math.round(change);
  return `${signPrefix(rounded)}${Math.abs(rounded)}%`;
};

/** A share in whole percent; one that rounds to zero still shows it is there. */
export const shareCell = (share: number) => (share < 0.5 ? '<1%' : `${Math.round(share)}%`);

/** A difference of rates in percentage points with its sign: +1.3 п.п., −0.4 п.п. */
export const pointsCell = (difference: number) => {
  const rounded = Math.round(difference * 10) / 10;
  return `${signPrefix(rounded)}${Math.abs(rounded)} п.п.`;
};

export const FLOW_COLUMNS = ['Купівлі', 'Купони', 'Погашення'];

export const flowCells = ({ invested, coupons, redemptions }: Flows) => [
  amountCell(invested),
  amountCell(coupons),
  amountCell(redemptions),
];

/** A year's label in a table: «2027*» when its sums are partly a forecast (`FORECAST_NOTE`). */
export const yearCell = ({ year, forecast }: { year: number; forecast: boolean }) =>
  `${year}${forecast ? '*' : ''}`;

/** What the asterisk of `yearCell` means. */
export const FORECAST_NOTE =
  '* — прогноз: у році є виплати, що ще попереду, або заплановані купівлі.';

/** «По місяцях · Гривня, ₴» */
export const tableTitle = (title: string, currency: Currency) =>
  `${title} · ${CURRENCY_NAMES[currency]}, ${currencySign(currency)}`;

/** A month of a table by its short name: «січ». */
export const monthName = (month: string) => MONTHS_SHORT[Number(month.slice(5, 7)) - 1];

/** The quarters of a year as a table names them, by number. */
export const QUARTER_LABELS = ['', 'I кв.', 'II кв.', 'III кв.', 'IV кв.'];
