import { router } from 'expo-router';

import type { ReportName } from '@/features/report-filters';

import { HeaderButton } from '@/shared/ui';

type Props = {
  report: ReportName;
  activeFilterCount: number;
};

/** Header action of a report; a filled accent icon shows that some filters are on. */
export function ReportFiltersButton({ report, activeFilterCount }: Props) {
  const isFiltered = activeFilterCount > 0;
  const openFilters = () =>
    router.push({ pathname: '/report-filters/[report]', params: { report } });

  return (
    <HeaderButton
      icon={isFiltered ? 'options' : 'options-outline'}
      tone={isFiltered ? 'accent' : 'neutral'}
      accessibilityLabel={isFiltered ? `Фільтри, увімкнено: ${activeFilterCount}` : 'Фільтри'}
      onPress={openFilters}
    />
  );
}
