import { type Currency, type Operation } from '@/lib/portfolio/portfolio';
import { resultsByCurrency, type WalletPosition } from '@/lib/portfolio/position';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

export function purchaseKeyRate(
  operations: Operation[],
  rateOn: (date: string) => number | null,
): number | null {
  const purchases = operations.filter((operation) => operation.type === 'purchase');
  const rates = purchases.map((purchase) => rateOn(purchase.date));
  if (!purchases.length || rates.some((rate) => rate === null)) return null;
  const total = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  return total
    ? round2(
        purchases.reduce((sum, purchase, index) => sum + purchase.amount * (rates[index] ?? 0), 0) /
          total,
      )
    : null;
}

/** Summary and individual bond details belong together under their currency. */
export function yieldReportSections(
  currency: Currency,
  positions: WalletPosition[],
  keyRate: number | null,
  rateOn: (date: string) => number | null,
): ReportSection[] {
  const total = resultsByCurrency(positions)[0];
  const ranked = positions
    .filter((item) => item.annualYield !== null)
    .sort((a, b) => (b.annualYield ?? 0) - (a.annualYield ?? 0));
  const shown = ranked.length <= 5 ? ranked : [...ranked.slice(0, 4), ranked[ranked.length - 1]];
  const knownRates = positions.filter((item) => item.bond && item.position.investedAmount > 0);
  const rateWeight = knownRates.reduce((sum, item) => sum + item.position.investedAmount, 0);
  const averageCoupon = rateWeight
    ? round2(
        knownRates.reduce(
          (sum, item) => sum + (item.bond?.rate ?? 0) * item.position.investedAmount,
          0,
        ) / rateWeight,
      )
    : null;
  return [
    {
      title: `Підсумок · ${currency}`,
      chart: {
        title: 'Річна дохідність облігацій',
        currency,
        percent: true,
        bars: shown.map((item) => ({ label: item.position.isin, value: item.annualYield ?? 0 })),
      },
      rows: [
        {
          label: 'Середня річна дохідність',
          value: total.annualYield === null ? '—' : formatPercent(total.annualYield),
        },
        {
          label: 'Середня ставка купону',
          value: averageCoupon === null ? '—' : formatPercent(averageCoupon),
        },
        ...(currency === 'UAH'
          ? [
              {
                label: 'Облікова ставка НБУ зараз',
                value: keyRate === null ? '—' : formatPercent(keyRate),
              },
            ]
          : []),
      ],
      footer: `Середні показники зважені за сумою купівель. Без розрахованої річної дохідності: ${total.withoutYieldCount}.${currency === 'UAH' ? ' Ставки НБУ на дати купівель зважені за їхніми сумами; для майбутніх купівель використано поточну ставку.' : ''}${ranked.length > 5 ? ' На графіку — чотири найвищі та найнижча річна дохідність.' : ''}`,
    },
    ...positions.map((item): ReportSection => {
      const historicalRate =
        currency === 'UAH' ? purchaseKeyRate(item.position.operations, rateOn) : null;
      return {
        title: `${item.position.isin} · ${currency}`,
        rows: [
          {
            label: 'Річна дохідність',
            value: item.annualYield === null ? '—' : formatPercent(item.annualYield),
          },
          { label: 'Ставка купону', value: item.bond ? formatPercent(item.bond.rate) : '—' },
          ...(currency === 'UAH'
            ? [
                {
                  label: 'Ставка НБУ на дати купівлі',
                  value: historicalRate === null ? '—' : formatPercent(historicalRate),
                },
              ]
            : []),
        ],
      };
    }),
  ];
}
