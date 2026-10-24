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
