import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  resetStructureReportFilters,
  toggleStructureReportIsin,
  updateStructureReportFilters,
  type StructurePurchases,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView, Section, SegmentedSelect } from '@/shared/ui';
import { useStructureReport } from '../model/useStructureReport.hook';
import { ReportScopeSections } from './ReportScopeSections';
import { STRUCTURE_PURCHASES_LABELS } from './structureLabels';

const PURCHASES_OPTIONS = (['all', 'made'] as const).map((value) => ({
  label: STRUCTURE_PURCHASES_LABELS[value],
  value,
}));

/** What the portfolio structure report covers; every change applies at once and is remembered. */
export default function StructureReportFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = useStructureReport();

  const changePurchases = (purchases: StructurePurchases) =>
    updateStructureReportFilters({ purchases });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetStructureReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <Section
        title="Купівлі"
        footer="Із запланованими — гроші плану, разом із купівлями, дата яких ще попереду; лише зроблені — те, що вже вкладено."
      >
        <View style={styles.picker}>
          <SegmentedSelect
            options={PURCHASES_OPTIONS}
            value={filters.purchases}
            onChange={changePurchases}
          />
        </View>
      </Section>

      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updateStructureReportFilters}
        onToggleIsin={toggleStructureReportIsin}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
