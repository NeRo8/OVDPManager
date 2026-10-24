import type { Currency, Wallet } from '@/entities/portfolio';
import { reportYears } from '@/features/report-filters';
import { round2 } from '@/shared/lib';
import { type CurrencyReport, type Flows, periodReport } from './periodReport';
import { yearReport } from './yearReport';

/** One year of the wallet in one currency, next to the others. */
export type YearRow = Flows & {
  year: number;
  /** Coupons plus redemptions */
  totalPayments: number;
  /** «Сальдо року» */
  balance: number;
  /** «Дохід за рік» */
  income: number;
  /** The income against the year before, %; null for the first year or after one without income */
  incomeChange: number | null;
};

/** The years that stand out; each is left out when there are not two years to compare. */
export type YearHighlights = {
  highestIncome?: YearRow;
  highestPayments?: YearRow;
  highestInvested?: YearRow;
};

/** Every year of the wallet in one currency, and all of them together. */
export type CurrencyYears = {
  currency: Currency;
  /** From the currency's first purchase or payment to its last, years without any included */
  years: YearRow[];
  /** All the years summed up */
  total: CurrencyReport;
  highlights: YearHighlights;
};

const EMPTY_YEAR = {
  invested: 0,
  coupons: 0,
  redemptions: 0,
  totalPayments: 0,
  balance: 0,
  income: 0,
};

/** The year with the largest positive value. */
function highest(years: YearRow[], value: (year: YearRow) => number): YearRow | undefined {
  if (years.length < 2) return undefined;
  const top = years.reduce((best, year) => (value(year) > value(best) ? year : best));
  return value(top) > 0 ? top : undefined;
}

/** The wallet's years side by side, per currency, from the first purchase to the last payment. */
export function yearOverYearReport(wallet: Wallet): CurrencyYears[] {
  const { firstYear, lastYear } = reportYears(wallet);
  const byYear = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
    const year = firstYear + index;
    return { year, currencies: yearReport(wallet, year) };
  });
  const totals = periodReport(wallet, `${firstYear}-01-01`, `${lastYear}-12-31`);

  return totals.map((total) => {
    const inCurrency = byYear.map(({ year, currencies }) => ({
      year,
      report: currencies.find((report) => report.currency === total.currency),
    }));
    const first = inCurrency.findIndex(({ report }) => report);
    const last = inCurrency.findLastIndex(({ report }) => report);

    const years: YearRow[] = [];
    for (const { year, report } of inCurrency.slice(first, last + 1)) {
      const { invested, coupons, redemptions, totalPayments, balance, income } =
        report ?? EMPTY_YEAR;
      const previous = years.at(-1);
      years.push({
        year,
        invested,
        coupons,
        redemptions,
        totalPayments,
        balance,
        income,
        incomeChange:
          previous && previous.income > 0
            ? round2(((income - previous.income) / previous.income) * 100)
            : null,
      });
    }

    return {
      currency: total.currency,
      years,
      total,
      highlights: {
        highestIncome: highest(years, (year) => year.income),
        highestPayments: highest(years, (year) => year.totalPayments),
        highestInvested: highest(years, (year) => year.invested),
      },
    };
  });
}
