import type { Wallet } from '@/entities/portfolio';

import { EmptyState } from '@/shared/ui';

type Props = {
  /** The wallet narrowed to the currency and bonds of the filters */
  wallet: Wallet;
};

/** Why the structure report has no money to split, and what would show some. */
export function StructureEmpty({ wallet }: Props) {
  const inCirculation = wallet.positions.filter(({ state }) => state !== 'redeemed');

  if (!wallet.positions.length) {
    return (
      <EmptyState
        layout="inline"
        icon="funnel-outline"
        title="ОВДП немає"
        message="Обраних у фільтрах валюти чи ОВДП немає в гаманці. Змініть фільтри."
      />
    );
  }
  if (!inCirculation.length) {
    return (
      <EmptyState
        layout="inline"
        icon="checkmark-done-outline"
        title="Усі ОВДП погашено"
        message="Гроші з них уже повернулися, тож розподіляти нічого. Погашені ОВДП є у звіті по портфелю."
      />
    );
  }
  if (inCirculation.every(({ bond }) => !bond)) {
    return (
      <EmptyState
        layout="inline"
        icon="cloud-offline-outline"
        title="Немає даних НБУ"
        message="Строків погашення цих ОВДП немає в даних НБУ, тож розподілити гроші за ними неможливо."
      />
    );
  }
  // What is left: only planned purchases, which «Лише зроблені» leaves out.
  return (
    <EmptyState
      layout="inline"
      icon="hourglass-outline"
      title="Купівель ще не зроблено"
      message="Усі купівлі ОВДП в обігу заплановані. Щоб урахувати їх, оберіть «Із запланованими» у фільтрах."
    />
  );
}
