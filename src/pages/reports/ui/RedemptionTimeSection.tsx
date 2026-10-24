import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type RedemptionTime, updateReportFilters } from '@/features/report-filters';
import { Section, SegmentedSelect } from '@/shared/ui';
import { useReport } from '../model/useReport.hook';
import { REDEMPTION_TIME_LABELS } from './redemptionLabels';

const TIME_OPTIONS = (['upcoming', 'past', 'all'] as const).map((value) => ({
  label: REDEMPTION_TIME_LABELS[value],
  value,
}));

/** Which redemptions the redemptions report covers: still ahead, received, or both. */
export function RedemptionTimeSection() {
  const { filters } = useReport('redemptions');

  const changeTime = (time: RedemptionTime) => updateReportFilters('redemptions', { time });

  return (
    <Section
      title="Час"
      footer="Майбутні — погашення, яких ще не отримано; отримані — ті, що вже надійшли."
    >
      <View style={styles.picker}>
        <SegmentedSelect options={TIME_OPTIONS} value={filters.time} onChange={changeTime} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
