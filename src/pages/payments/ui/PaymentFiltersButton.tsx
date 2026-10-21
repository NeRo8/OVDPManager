import { router } from 'expo-router';

import { HeaderButton } from '@/shared/ui';
import { useUpcomingPayments } from '../model/useUpcomingPayments.hook';

/** Header action of the payments tab; a filled accent icon shows that some filters are on. */
export function PaymentFiltersButton() {
  const { activeFilterCount } = useUpcomingPayments();
  const isFiltered = activeFilterCount > 0;

  return (
    <HeaderButton
      icon={
        isFiltered
          ? { ios: 'line.3.horizontal.decrease.circle.fill', android: 'filter_alt' }
          : { ios: 'line.3.horizontal.decrease.circle', android: 'filter_list' }
      }
      tone={isFiltered ? 'accent' : 'neutral'}
      size={26}
      accessibilityLabel={isFiltered ? `Фільтри, увімкнено: ${activeFilterCount}` : 'Фільтри'}
      onPress={() => router.push('/payment-filters')}
    />
  );
}
