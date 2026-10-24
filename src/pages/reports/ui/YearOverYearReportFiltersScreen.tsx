import { Stack } from 'expo-router';

import {
  resetYearOverYearReportFilters,
  toggleYearOverYearReportIsin,
  updateYearOverYearReportFilters,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView } from '@/shared/ui';
import { useYearOverYearReport } from '../model/useYearOverYearReport.hook';
import { ReportScopeSections } from './ReportScopeSections';

/** What the year-over-year report covers; every change applies at once and is remembered. */
export default function YearOverYearReportFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = useYearOverYearReport();

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetYearOverYearReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updateYearOverYearReportFilters}
        onToggleIsin={toggleYearOverYearReportIsin}
      />
    </ScreenScrollView>
  );
}
