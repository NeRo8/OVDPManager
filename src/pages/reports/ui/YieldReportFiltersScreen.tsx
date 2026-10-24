import { Stack } from 'expo-router';

import {
  resetYieldReportFilters,
  toggleYieldReportIsin,
  updateYieldReportFilters,
  type PortfolioStatus,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView } from '@/shared/ui';
import { useYieldReport } from '../model/useYieldReport.hook';
import { BondStatusSection } from './BondStatusSection';
import { ReportScopeSections } from './ReportScopeSections';

/** What the yield report covers; every change applies at once and is remembered. */
export default function YieldReportFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = useYieldReport();

  const changeStatus = (status: PortfolioStatus) => updateYieldReportFilters({ status });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetYieldReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <BondStatusSection value={filters.status} onChange={changeStatus} />
      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updateYieldReportFilters}
        onToggleIsin={toggleYieldReportIsin}
      />
    </ScreenScrollView>
  );
}
