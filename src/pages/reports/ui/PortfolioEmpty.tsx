import type { Wallet } from '@/entities/portfolio';
import type { PortfolioStatus } from '@/features/report-filters';
import { formatDate } from '@/shared/lib';
import { EmptyState } from '@/shared/ui';

type Props = {
  /** The wallet narrowed to the currency and bonds of the filters */
  wallet: Wallet;
  status: PortfolioStatus;
};

/** Why the portfolio report has no bonds, and which filter would show some. */
export function PortfolioEmpty({ wallet, status }: Props) {
  const next = wallet.positions
    .flatMap(({ bond }) => (bond ? [bond] : []))
    .sort((first, second) => first.maturityDate.localeCompare(second.maturityDate))
    .at(0);

  if (wallet.positions.length > 0 && status === 'active') {
    return (
      <EmptyState
        layout="inline"
        icon="checkmark-done-outline"
        title="Усі ОВДП погашено"
        message="Виплат за ними більше не буде. Щоб побачити погашені ОВДП, оберіть «Погашені» у фільтрах."
      />
    );
  }
  if (wallet.positions.length > 0 && status === 'redeemed') {
    return (
      <EmptyState
        layout="inline"
        icon="hourglass-outline"
        title="Погашених ОВДП ще немає"
        message={[
          next && `Найближче погашення — ${formatDate(next.maturityDate)}, ${next.isin}.`,
          'Щоб побачити ОВДП в обігу, оберіть «В обігу» у фільтрах.',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    );
  }
  return (
    <EmptyState
      layout="inline"
      icon="funnel-outline"
      title="ОВДП немає"
      message="Обраних у фільтрах валюти чи ОВДП немає в гаманці. Змініть фільтри."
    />
  );
}
