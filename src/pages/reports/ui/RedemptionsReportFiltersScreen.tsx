import { Stack } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  resetRedemptionsReportFilters,
  toggleRedemptionsReportIsin,
  updateRedemptionsReportFilters,
  type RedemptionTime,
} from '@/features/report-filters';
import { HeaderButton, ScreenScrollView, Section, SegmentedSelect } from '@/shared/ui';
import { useRedemptionsReport } from '../model/useRedemptionsReport.hook';
import { REDEMPTION_TIME_LABELS } from './redemptionLabels';
import { ReportScopeSections } from './ReportScopeSections';

const TIME_OPTIONS = (['upcoming', 'past', 'all'] as const).map((value) => ({
  label: REDEMPTION_TIME_LABELS[value],
  value,
}));

/** What the redemptions report covers; every change applies at once and is remembered. */
export default function RedemptionsReportFiltersScreen() {
  const { wallet, filters, options, activeFilterCount } = useRedemptionsReport();

  const changeTime = (time: RedemptionTime) => updateRedemptionsReportFilters({ time });

  return (
    <ScreenScrollView>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderButton
              icon="refresh"
              accessibilityLabel="Скинути фільтри"
              onPress={resetRedemptionsReportFilters}
              disabled={activeFilterCount === 0}
            />
          ),
        }}
      />
      <Section
        title="Час"
        footer="Майбутні — погашення, яких ще не отримано; отримані — ті, що вже надійшли."
      >
        <View style={styles.picker}>
          <SegmentedSelect options={TIME_OPTIONS} value={filters.time} onChange={changeTime} />
        </View>
      </Section>

      <ReportScopeSections
        wallet={wallet}
        scope={filters}
        options={options}
        onChange={updateRedemptionsReportFilters}
        onToggleIsin={toggleRedemptionsReportIsin}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
