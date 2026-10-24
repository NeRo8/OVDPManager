import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  resetPortfolioReportFilters,
  togglePortfolioReportIsin,
  updatePortfolioReportFilters,
  type PortfolioStatus,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView, Section, SegmentedSelect } from '@/shared/ui';
import { usePortfolioReport } from '../model/usePortfolioReport.hook';
import { PORTFOLIO_STATUS_LABELS } from './portfolioLabels';
import { ReportScopeSections } from './ReportScopeSections';

const STATUS_OPTIONS = (['all', 'active', 'redeemed'] as const).map((value) => ({
  label: PORTFOLIO_STATUS_LABELS[value],
  value,
}));

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
      <Section
        title="Стан"
        footer="В обігу — ОВДП, за якими ще будуть виплати, і заплановані купівлі; погашені — ті, за якими всі виплати вже отримано."
      >
        <View style={styles.picker}>
          <SegmentedSelect
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={changeStatus}
          />
        </View>
      </Section>

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

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
