import { router } from 'expo-router';

import { HeaderButton } from '@/shared/ui';

type Props = {
  isin: string;
};

/** Header action of the bond card: weigh selling the bond at a quoted price. */
export function SaleButton({ isin }: Props) {
  const openSale = () => router.push({ pathname: '/bond/[isin]/sale', params: { isin } });

  return <HeaderButton icon="cash-outline" accessibilityLabel="Продаж" onPress={openSale} />;
}
