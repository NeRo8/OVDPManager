import { router } from 'expo-router';

import { HeaderButton } from '@/shared/ui';

import { useFilteredWallet } from '../model/useFilteredWallet.hook';

/** Header action of the payments tab; a filled accent icon shows that some filters are on. */
export function PaymentFiltersButton() {
  const { activeFilterCount } = useFilteredWallet();
  const isFiltered = activeFilterCount > 0;
  const openFilters = () => router.push('/payment-filters');

  return (
    <HeaderButton
      icon={isFiltered ? 'options' : 'options-outline'}
      tone={isFiltered ? 'accent' : 'neutral'}
      accessibilityLabel={isFiltered ? `Фільтри, увімкнено: ${activeFilterCount}` : 'Фільтри'}
      onPress={openFilters}
    />
  );
}
