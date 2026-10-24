import type { Wallet } from '@/entities/portfolio';
import type { RedemptionTime } from '@/features/report-filters';
import { formatDate } from '@/shared/lib';
import { EmptyState } from '@/shared/ui';

type Props = {
  /** The wallet narrowed to the currency and bonds of the filters */
  wallet: Wallet;
  time: RedemptionTime;
  /** A currency or bonds are picked in the filters */
  isScoped: boolean;
};

/** Why the redemptions report has nothing to show, and which filter would show some. */
export function RedemptionsEmpty({ wallet, time, isScoped }: Props) {
  const redemptions = wallet.payments.filter((payment) => payment.type === 'redemption');
  const first = redemptions.find((payment) => !payment.isPaid);
  const last = redemptions.findLast((payment) => payment.isPaid);

  if (time === 'upcoming' && last) {
    return (
      <EmptyState
        layout="inline"
        icon="checkmark-done-outline"
        title="Усі погашення отримано"
        message={`Останнє погашення надійшло ${formatDate(last.date)}. Щоб побачити отримані погашення, оберіть «Отримані» у фільтрах.`}
      />
    );
  }
  if (time === 'past' && first) {
    return (
      <EmptyState
        layout="inline"
        icon="hourglass-outline"
        title="Погашень ще не було"
        message={`Перше погашення — ${formatDate(first.date)}, ${first.isin}. Щоб побачити майбутні погашення, оберіть «Майбутні» у фільтрах.`}
      />
    );
  }
  return isScoped ? (
    <EmptyState
      layout="inline"
      icon="funnel-outline"
      title="Погашень немає"
      message="Обрані у фільтрах валюта чи ОВДП не мають погашень у даних НБУ. Змініть фільтри."
    />
  ) : (
    <EmptyState
      layout="inline"
      icon="calendar-outline"
      title="Погашень немає"
      message="НБУ ще не опублікував погашень для ОВДП цього плану. Вони з’являться, щойно дані оновляться."
    />
  );
}
