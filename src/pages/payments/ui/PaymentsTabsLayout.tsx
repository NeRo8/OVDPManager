import { WalletGate, useActivePurchases, useBonds } from '@/entities/portfolio';
import { TopTabs } from '@/shared/ui';

/** The payments tab: payments still ahead, or a whole year with its chart. Filters apply to both. */
export function PaymentsTabsLayout() {
  const { purchases } = useActivePurchases();
  const { bonds, error, refresh } = useBonds();

  return (
    <WalletGate wallet={{ numberOfPurchases: purchases.length, bonds, error, refresh }}>
      <TopTabs>
        <TopTabs.Screen name="index" options={{ title: 'Майбутні' }} />
        <TopTabs.Screen name="year" options={{ title: 'За рік' }} />
      </TopTabs>
    </WalletGate>
  );
}
