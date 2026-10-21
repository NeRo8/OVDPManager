import { WalletGate, useBonds, useHoldings } from '@/entities/portfolio';
import { TopTabs } from '@/shared/ui';

/** The payments tab: payments still ahead, or a whole year with its chart. Filters apply to both. */
export function PaymentsTabsLayout() {
  const holdings = useHoldings();
  const { bonds, error, refresh } = useBonds();

  return (
    <WalletGate wallet={{ holdingsCount: holdings.length, bonds, error, refresh }}>
      <TopTabs>
        <TopTabs.Screen name="index" options={{ title: 'Майбутні' }} />
        <TopTabs.Screen name="year" options={{ title: 'За рік' }} />
      </TopTabs>
    </WalletGate>
  );
}
