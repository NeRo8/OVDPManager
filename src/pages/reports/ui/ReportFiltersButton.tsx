import { type Href, router } from 'expo-router';

import { HeaderButton } from '@/shared/ui';

type Props = {
  activeFilterCount: number;
  /** The report's filters modal */
  href: Href;
};

/** Header action of a report; a filled accent icon shows that some filters are on. */
export function ReportFiltersButton({ activeFilterCount, href }: Props) {
  const isFiltered = activeFilterCount > 0;
  const openFilters = () => router.push(href);

  return (
    <HeaderButton
      icon={isFiltered ? 'options' : 'options-outline'}
      tone={isFiltered ? 'accent' : 'neutral'}
      accessibilityLabel={isFiltered ? `Фільтри, увімкнено: ${activeFilterCount}` : 'Фільтри'}
      onPress={openFilters}
    />
  );
}
