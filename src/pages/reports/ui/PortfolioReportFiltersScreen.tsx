import { Stack } from 'expo-router';

import {
  resetPortfolioReportFilters,
  togglePortfolioReportIsin,
  updatePortfolioReportFilters,
  type PortfolioStatus,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView } from '@/shared/ui';
import { usePortfolioReport } from '../model/usePortfolioReport.hook';
import { BondStatusSection } from './BondStatusSection';
import { ReportScopeSections } from './ReportScopeSections';

/** What the portfolio report covers; every change applies at once and is remembered. */
export default function PortfolioReportFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = usePortfolioReport();

  const changeStatus = (status: PortfolioStatus) => updatePortfolioReportFilters({ status });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetPortfolioReportFilters}
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
        onChange={updatePortfolioReportFilters}
        onToggleIsin={togglePortfolioReportIsin}
      />
    </ScreenScrollView>
  );
}
