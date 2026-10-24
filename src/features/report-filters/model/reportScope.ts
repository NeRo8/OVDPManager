import { CURRENCIES, type Currency, type Wallet } from '@/entities/portfolio';

/** What a report covers besides its time: the filters every report with filters has. */
export type ReportScope = {
  /** Null, or a currency the wallet no longer has: every currency */
  currency: Currency | null;
  /** Bonds to report on; empty reports on every bond */
  isins: string[];
};

/** What a report can be narrowed to. */
export type ReportScopeOptions = {
  /** Bonds NBU knows, by ISIN */
  isins: string[];
  /** In `CURRENCIES` order */
  currencies: Currency[];
};

export function reportScopeOptions(wallet: Wallet): ReportScopeOptions {
  return {
    isins: wallet.positions
      .filter(({ bond }) => bond)
      .map(({ position }) => position.isin)
      .sort(),
    currencies: CURRENCIES.filter((currency) =>
      [...wallet.payments, ...wallet.purchaseEvents].some((event) => event.currency === currency),
    ),
  };
}

/** The saved filters fitted to the wallet: a bond or a currency it no longer has is dropped. */
export function effectiveScope<T extends ReportScope>(filters: T, options: ReportScopeOptions): T {
  return {
    ...filters,
    currency:
      filters.currency && options.currencies.includes(filters.currency) ? filters.currency : null,
    isins: filters.isins.filter((isin) => options.isins.includes(isin)),
  };
}

/** The bonds with the bond added, or without it when it is there. */
export function toggledIsins(isins: string[], isin: string): string[] {
  return isins.includes(isin) ? isins.filter((i) => i !== isin) : [...isins, isin];
}

/** How many of the scope's filters are on. */
export function countScopeFilters({ currency, isins }: ReportScope): number {
  return [currency !== null, isins.length > 0].filter(Boolean).length;
}

/** The wallet with only the currency and the bonds the scope lets through. */
export function filterWallet(wallet: Wallet, { currency, isins }: ReportScope): Wallet {
  const passes = (item: { currency: Currency; isin: string }) =>
    (currency === null || item.currency === currency) &&
    (isins.length === 0 || isins.includes(item.isin));
  return {
    ...wallet,
    positions: wallet.positions.filter((item) =>
      passes({ currency: item.currency, isin: item.position.isin }),
    ),
    payments: wallet.payments.filter(passes),
    purchaseEvents: wallet.purchaseEvents.filter(passes),
  };
}
