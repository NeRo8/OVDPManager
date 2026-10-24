import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import type { PortfolioStatus } from '@/features/report-filters';
import { Section, SegmentedSelect } from '@/shared/ui';
import { PORTFOLIO_STATUS_LABELS } from './portfolioLabels';

type Props = {
  value: PortfolioStatus;
  onChange: (status: PortfolioStatus) => void;
};

const STATUS_OPTIONS = (['all', 'inCirculation', 'redeemed'] as const).map((value) => ({
  label: PORTFOLIO_STATUS_LABELS[value],
  value,
}));

/** Which bonds a report covers by where they stand, in its filters screen. */
export function BondStatusSection({ value, onChange }: Props) {
  return (
    <Section
      title="Стан"
      footer="В обігу — ОВДП, за якими ще будуть виплати, і заплановані купівлі; погашені — ті, за якими всі виплати вже отримано."
    >
      <View style={styles.picker}>
        <SegmentedSelect options={STATUS_OPTIONS} value={value} onChange={onChange} />
      </View>
    </Section>
  );
}

const styles = StyleSheet.create((theme) => ({
  picker: { padding: theme.space.md },
}));
