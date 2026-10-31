import { plural } from '@/shared/lib';

/** How a report names its span in the shared blocks: the year report and the period report. */
export type ReportTerms = {
  /** The payments less the purchases */
  balance: string;
  /** Coupons plus what redemptions brought over the cost */
  income: string;
  /** The span in the genitive, as in «ОВДП року» */
  span: string;
};

export const YEAR_TERMS: ReportTerms = {
  balance: 'Сальдо року',
  income: 'Дохід за рік',
  span: 'року',
};

export const PERIOD_TERMS: ReportTerms = {
  balance: 'Сальдо періоду',
  income: 'Дохід за період',
  span: 'періоду',
};

export const ALL_YEARS_TERMS: ReportTerms = {
  balance: 'Сальдо за всі роки',
  income: 'Дохід за всі роки',
  span: 'усіх років',
};

/**
 * How many months the coupons are spread over, after «поділені на»: «12 місяців», «3 місяці», and
 * a part of a month with its decimals, «9,97 місяця».
 */
export function monthCountLabel(count: number): string {
  if (Number.isInteger(count)) return `${count} ${plural(count, 'місяць', 'місяці', 'місяців')}`;
  return `${new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 }).format(count)} місяця`;
}

/** The footer under the sums of a year or a period: what the average and the totals mean. */
export const summaryFooter = (terms: ReportTerms, monthCount: number): string =>
  `${terms.balance} — виплати мінус купівлі. ${terms.income} — купони та різниця між погашенням і ціною купівлі погашених ОВДП. Купони в середньому за місяць — купони ${terms.span}, поділені на ${monthCountLabel(monthCount)}; погашення повертає номінал, а не приносить нові гроші щомісяця, тож у середнє не входить.`;
