import { router } from 'expo-router';

import { HeaderButton } from '@/components/button/HeaderButton';
import { useWalletFilters } from '@/stores/operations';

export function WalletFiltersButton() {
  const { kind, currency } = useWalletFilters();
  const activeFilterCount = Number(kind !== 'all') + Number(currency !== 'all');

  return (
    <HeaderButton
      icon={activeFilterCount ? 'options' : 'options-outline'}
      tone={activeFilterCount ? 'accent' : 'neutral'}
      accessibilityLabel={
        activeFilterCount ? `Фільтри, увімкнено: ${activeFilterCount}` : 'Фільтри'
      }
      onPress={() => router.push('/wallet-filters')}
    />
  );
}
