import { WalletGate } from '@/entities/portfolio';
import { TopTabs } from '@/shared/ui';

/** The payments tab: payments still ahead, or a whole year with its chart. Filters apply to both. */
export function PaymentsTabsLayout() {
  return (
    <WalletGate>
      <TopTabs>
        <TopTabs.Screen name="index" options={{ title: 'Майбутні' }} />
        <TopTabs.Screen name="year" options={{ title: 'За рік' }} />
      </TopTabs>
    </WalletGate>
  );
}
