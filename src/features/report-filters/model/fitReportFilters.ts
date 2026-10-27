import {
  type Wallet,
  type WalletPosition,
  type WalletScopeOptions,
  fitScope,
  narrowWallet,
  purchaseCurrency,
  walletScopeOptions,
} from '@/entities/portfolio';
import { periodDates } from './periodDates';
import { initialState } from './reportFilters/store';
import type { Period, ReportFiltersState, ReportName, ReportScope } from './reportFilters';
import { type ReportYears, reportYears } from './reportYears';

/** Each report's filters as its screen uses them: fitted to the wallet, with what follows. */
export type FittedReportFilters = {
  year: Omit<ReportFiltersState['year'], 'year'> & {
    /** The year shown */
    year: number;
    years: ReportYears;
  };
  fx: ReportFiltersState['fx'] & { years: ReportYears };
  period: ReportFiltersState['period'] & { dates: Period };
  yearOverYear: ReportFiltersState['yearOverYear'];
  redemptions: ReportFiltersState['redemptions'];
  portfolio: ReportFiltersState['portfolio'];
  structure: ReportFiltersState['structure'];
  yield: ReportFiltersState['yield'];
  bond: {
    /** The bond shown; missing only for an empty wallet */
    isin?: string;
    /** The wallet's bonds to pick from, the nearest to maturity first and the default */
    choices: WalletPosition[];
  };
};

/** A report's saved filters fitted to the wallet, and the wallet they leave. */
export type FittedReport<R extends ReportName> = {
  filters: FittedReportFilters[R];
  /** What the currency and bonds can be narrowed to */
  options: WalletScopeOptions;
  /** The wallet narrowed to the filters' currency and bonds; the whole one for the bond report */
  narrowed: Wallet;
  /** How many filters differ from fresh ones */
  activeFilterCount: number;
};

/** A report's own fitting: its filters, and how many of its own ones differ from fresh. */
type Fitter<R extends ReportName> = (
  saved: ReportFiltersState[R],
  wallet: Wallet,
  options: WalletScopeOptions,
) => { filters: FittedReportFilters[R]; changed: number };

const FITTERS: { [R in ReportName]: Fitter<R> } = {
  year: (saved, wallet, options) => {
    const years = reportYears(wallet);
    const year =
      saved.year !== null && saved.year >= years.firstYear && saved.year <= years.lastYear
        ? saved.year
        : years.defaultYear;
    return {
      filters: { ...fitScope(saved, options), year, years },
      changed: Number(year !== years.defaultYear),
    };
  },
  fx: (saved, wallet, options) => {
    const currentYear = Number(wallet.today.slice(0, 4));
    const pastPurchases = wallet.purchases.filter(
      (purchase) =>
        purchase.purchaseDate <= wallet.today &&
        purchaseCurrency(purchase, wallet.byIsin.get(purchase.isin)) === 'UAH',
    );
    const firstYear = pastPurchases.length
      ? Math.min(...pastPurchases.map((purchase) => Number(purchase.purchaseDate.slice(0, 4))))
      : currentYear;
    const years: ReportYears = { firstYear, lastYear: currentYear, defaultYear: currentYear };
    const year =
      saved.year !== null && saved.year >= firstYear && saved.year <= currentYear
        ? saved.year
        : null;
    return {
      filters: {
        currency: 'UAH',
        isins: saved.isins.filter((isin) => options.isins.includes(isin)),
        targetCurrency: saved.targetCurrency,
        year,
        years,
      },
      changed: Number(year !== null) + Number(saved.targetCurrency !== 'USD'),
    };
  },
  period: (saved, wallet, options) => ({
    filters: {
      ...fitScope(saved, options),
      dates: periodDates(saved.period, wallet, saved.custom),
    },
    changed: Number(saved.period !== initialState.period.period),
  }),
  yearOverYear: (saved, _, options) => ({ filters: fitScope(saved, options), changed: 0 }),
  redemptions: (saved, _, options) => ({
    filters: fitScope(saved, options),
    changed: Number(saved.time !== initialState.redemptions.time),
  }),
  portfolio: (saved, _, options) => ({
    filters: fitScope(saved, options),
    changed: Number(saved.status !== initialState.portfolio.status),
  }),
  structure: (saved, _, options) => ({
    filters: fitScope(saved, options),
    changed: Number(saved.purchases !== initialState.structure.purchases),
  }),
  yield: (saved, _, options) => ({
    filters: fitScope(saved, options),
    changed: Number(saved.status !== initialState.yield.status),
  }),
  bond: (saved, wallet) => {
    const choices = [...wallet.positions].sort((first, second) =>
      (first.bond?.maturityDate ?? '9999').localeCompare(second.bond?.maturityDate ?? '9999'),
    );
    const isins = choices.map(({ position }) => position.isin);
    const isin = saved.isin !== null && isins.includes(saved.isin) ? saved.isin : isins[0];
    return { filters: { isin, choices }, changed: Number(isin !== isins[0]) };
  },
};

const isScope = (filters: object): filters is ReportScope => 'isins' in filters;

/** A currency or some bonds are picked: the report covers less than the whole wallet. */
export const isScopeOn = (scope: ReportScope) => scope.currency !== null || scope.isins.length > 0;

/**
 * A report's saved filters fitted to the wallet: what it covers, the wallet narrowed to it and
 * how many filters are on. A saved bond, currency or year the wallet no longer has gives way to
 * the default, so saved filters never hide everything.
 */
export function fitReportFilters<R extends ReportName>(
  report: R,
  saved: ReportFiltersState[R],
  wallet: Wallet,
): FittedReport<R> {
  const options = walletScopeOptions(
    report === 'fx' ? narrowWallet(wallet, { currency: 'UAH', isins: [] }) : wallet,
  );
  const fit: Fitter<R> = FITTERS[report];
  const { filters, changed } = fit(saved, wallet, options);
  const scope = isScope(filters) ? filters : null;
  return {
    filters,
    options,
    narrowed: scope ? narrowWallet(wallet, scope) : wallet,
    activeFilterCount:
      changed +
      (scope
        ? Number(report !== 'fx' && scope.currency !== null) + Number(scope.isins.length > 0)
        : 0),
  };
}
