import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type StructurePurchases, updateReportFilters } from '@/features/report-filters';
import { Section, SegmentedSelect } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';
import { STRUCTURE_PURCHASES_LABELS } from './structureLabels';

const PURCHASES_OPTIONS = (['all', 'made'] as const).map((value) => ({
  label: STRUCTURE_PURCHASES_LABELS[value],
  value,
}));

/** Whose money the structure report splits: every purchase of the plan, or only those made. */
export function StructurePurchasesSection() {
  const { filters } = useReport('structure');

  const changePurchases = (purchases: StructurePurchases) =>
    updateReportFilters('structure', { purchases });

  return (
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
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
