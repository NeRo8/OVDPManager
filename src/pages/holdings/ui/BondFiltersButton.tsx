import { router } from 'expo-router';

import { useBondPicker } from '@/features/add-purchase';
import { HeaderButton } from '@/shared/ui';

/** Header action of the bond picker; a filled accent icon shows that the picker is narrowed or reordered. */
export function BondFiltersButton() {
  const { activeFilterCount } = useBondPicker();
  const isFiltered = activeFilterCount > 0;
  const openFilters = () => router.push('/bond-filters');

  return (
    <HeaderButton
      icon={isFiltered ? 'options' : 'options-outline'}
      tone={isFiltered ? 'accent' : 'neutral'}
      accessibilityLabel={isFiltered ? `Фільтри, змінено: ${activeFilterCount}` : 'Фільтри'}
      onPress={openFilters}
    />
  );
}
