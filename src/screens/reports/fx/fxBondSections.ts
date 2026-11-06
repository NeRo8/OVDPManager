import { purchaseLots } from '@/lib/portfolio/operations';
import type { Wallet } from '@/lib/portfolio/wallet';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatMoney } from '@/utils/format';
import { round2 } from '@/utils/number';

import type { convertFxEvents } from './fxReport';

/** A closed bond's historical FX result uses its actual dated cash flows. */
export function fxBondSections(
  wallet: Wallet,
  events: ReturnType<typeof convertFxEvents>,
  through: string,
  currency: string,
): ReportSection[] {
  return wallet.positions.flatMap(({ position, bond }): ReportSection[] => {
    const items = events.filter((event) => event.isin === position.isin);
    if (!items.length) return [];
    const total = (purchase: boolean) =>
      round2(
        items
          .filter((event) => (event.type === 'purchase') === purchase)
          .reduce((sum, event) => sum + event.equivalent, 0),
      );
    const invested = total(true);
    const received = total(false);
    const operations = position.operations.filter(
      (operation) => !operation.planned && operation.date <= through,
    );
    const lots = purchaseLots(operations);
    const sold = lots.length > 0 && lots.every((lot) => lot.remaining === 0);
    const redeemed =
      lots.length > 0 &&
      bond &&
      bond.maturityDate <= through &&
      bond.maturityDate < wallet.today &&
      bond.payments
        .filter(
          (payment) =>
            payment.type === 'redemption' && payment.date <= through && payment.date < wallet.today,
        )
        .reduce((sum, payment) => sum + payment.amount, 0) >= bond.nominal;
    return [
      {
        title: `Облігація · ${position.isin}`,
        rows: [
          { label: 'Вкладено за курсами купівель', value: formatMoney(invested, currency) },
          { label: 'Отримано за курсами надходжень', value: formatMoney(received, currency) },
          {
            label: 'Результат закритої позиції',
            value: sold || redeemed ? formatMoney(round2(received - invested), currency) : '—',
          },
        ],
        footer:
          sold || redeemed
            ? undefined
            : 'Результат показується після повного продажу або погашення.',
      },
    ];
  });
}
