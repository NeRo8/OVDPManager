import type { Currency } from '@/lib/portfolio/portfolio';
import { buildWallet, type Wallet } from '@/lib/portfolio/wallet';

export type ReportScope = { currency: Currency | null; isins: string[] };

export function fitReportScope(wallet: Wallet, scope: ReportScope): ReportScope {
  const currency =
    scope.currency && wallet.positions.some((item) => item.currency === scope.currency)
      ? scope.currency
      : null;
  const available = new Set(
    wallet.positions
      .filter((item) => !currency || item.currency === currency)
      .map(({ position }) => position.isin),
  );
  return { currency, isins: scope.isins.filter((isin) => available.has(isin)) };
}

/** Rebuild the wallet so positions, payments and operations describe the same selection. */
export function scopedWallet(wallet: Wallet, scope: ReportScope): Wallet {
  const selected = scope.isins;
  const operations = wallet.operations.filter(
    (operation) =>
      (!scope.currency || operation.currency === scope.currency) &&
      (!selected.length || selected.includes(operation.isin)),
  );
  return buildWallet(operations, wallet.byIsin, wallet.today);
}

export function reportScopeLabel(scope: ReportScope): string {
  return [
    scope.currency ?? 'Усі валюти',
    scope.isins.length ? scope.isins.join(', ') : 'Усі облігації',
  ].join(' · ');
}
