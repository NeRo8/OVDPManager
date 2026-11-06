import { CURRENCIES } from '@/lib/portfolio/portfolio';
import type { Wallet } from '@/lib/portfolio/wallet';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatPercent } from '@/utils/format';

/** Compare only bonds with a cash flow in the selected period and a known annual yield. */
export function cashFlowHighlights(wallet: Wallet, from: string, to: string): ReportSection[] {
  const involved = new Set(
    [...wallet.operationEvents, ...wallet.payments]
      .filter((event) => event.date >= from && event.date <= to)
      .map((event) => event.isin),
  );
  return CURRENCIES.flatMap((currency): ReportSection[] => {
    const positions = wallet.positions
      .filter(
        (item) =>
          item.currency === currency &&
          involved.has(item.position.isin) &&
          item.annualYield !== null,
      )
      .sort((a, b) => (b.annualYield ?? 0) - (a.annualYield ?? 0));
    if (positions.length < 2) return [];
    const first = positions[0];
    const last = positions[positions.length - 1];
    return [
      {
        title: `Дохідність облігацій · ${currency}`,
        rows: [
          {
            label: `Найвища · ${first.position.isin}`,
            value: formatPercent(first.annualYield ?? 0),
          },
          {
            label: `Найнижча · ${last.position.isin}`,
            value: formatPercent(last.annualYield ?? 0),
          },
        ],
      },
    ];
  });
}
