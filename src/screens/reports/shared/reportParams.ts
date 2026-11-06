import { z } from 'zod';

import { CURRENCIES, type Currency } from '@/lib/portfolio/portfolio';
import type { PortfolioStatus } from '@/screens/reports/portfolio/portfolioReport';
import type { RedemptionTime } from '@/screens/reports/redemptions/redemptionsReport';

export type ReportName =
  'fx' | 'period' | 'year-over-year' | 'redemptions' | 'portfolio' | 'structure' | 'yield' | 'bond';
export const REPORT_ROUTES: Record<ReportName, `/reports/${ReportName}`> = {
  fx: '/reports/fx',
  period: '/reports/period',
  'year-over-year': '/reports/year-over-year',
  redemptions: '/reports/redemptions',
  portfolio: '/reports/portfolio',
  structure: '/reports/structure',
  yield: '/reports/yield',
  bond: '/reports/bond',
};
export const REPORT_TITLES: Record<ReportName, string> = {
  fx: 'Валютний еквівалент',
  period: 'Звіт за період',
  'year-over-year': 'Звіт від року до року',
  redemptions: 'Графік погашень',
  portfolio: 'Звіт по портфелю',
  structure: 'Структура портфеля',
  yield: 'Річна дохідність',
  bond: 'Звіт по облігації',
};
export function isReportName(value: string): value is ReportName {
  return Object.prototype.hasOwnProperty.call(REPORT_ROUTES, value);
}

export type ReportSelection = {
  currency: Currency | null;
  isins: string[];
  year: string | null;
  from: string;
  to: string;
  time: RedemptionTime;
  status: PortfolioStatus;
  purchases: 'all' | 'made';
  targetCurrency: 'USD' | 'EUR';
  isin: string | null;
};
type RawParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const dateSchema = z.iso.date();

/** Route parameters are external input: invalid or absent values use safe report defaults. */
export function parseReportParams(
  params: RawParams,
  today: string,
  name: ReportName,
): ReportSelection {
  const currency = first(params.currency);
  const year = first(params.year);
  const from = first(params.from);
  const to = first(params.to);
  const time = first(params.time);
  const status = first(params.status);
  const purchases = first(params.purchases);
  const validDates =
    !!from &&
    !!to &&
    dateSchema.safeParse(from).success &&
    dateSchema.safeParse(to).success &&
    from <= to;
  const defaultStatus = name === 'yield' ? 'inCirculation' : 'all';
  return {
    currency: CURRENCIES.find((item) => item === currency) ?? null,
    isins: (first(params.isins) ?? '').split(',').filter(Boolean),
    year: year && /^\d{4}$/.test(year) && Number(year) >= 1 ? year : null,
    from: validDates && from ? from : `${today.slice(0, 4)}-01-01`,
    to: validDates && to ? to : today,
    time: time === 'past' || time === 'all' ? time : 'upcoming',
    status:
      status === 'all' || status === 'redeemed' || status === 'inCirculation'
        ? status
        : defaultStatus,
    purchases: purchases === 'made' ? 'made' : 'all',
    targetCurrency: first(params.targetCurrency) === 'EUR' ? 'EUR' : 'USD',
    isin: first(params.isin) || null,
  };
}

export function serializeReportParams(
  selection: ReportSelection,
  name: ReportName,
): Record<string, string> {
  const scope = {
    ...(selection.currency ? { currency: selection.currency } : {}),
    ...(selection.isins.length ? { isins: selection.isins.join(',') } : {}),
  };
  if (name === 'bond') return selection.isin ? { isin: selection.isin } : {};
  if (name === 'fx')
    return {
      ...(selection.isins.length ? { isins: selection.isins.join(',') } : {}),
      targetCurrency: selection.targetCurrency,
      ...(selection.year ? { year: selection.year } : {}),
    };
  if (name === 'period') return { ...scope, from: selection.from, to: selection.to };
  if (name === 'redemptions') return { ...scope, time: selection.time };
  if (name === 'portfolio' || name === 'yield') return { ...scope, status: selection.status };
  if (name === 'structure') return { ...scope, purchases: selection.purchases };
  return scope;
}
