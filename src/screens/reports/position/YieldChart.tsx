import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Card } from '@/components/layout/Card';
import { Typography } from '@/components/typography/Typography';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { formatPercent } from '@/utils/format';

type Props = { chart: NonNullable<ReportSection['chart']> };

export function YieldChart({ chart }: Props) {
  if (!chart.bars.length) return null;
  const max = Math.max(...chart.bars.map((bar) => Math.abs(bar.value)), 1);
  return (
    <Card title={`Річна дохідність за облігаціями · ${chart.currency}`}>
      {chart.bars.map((bar) => (
        <View
          key={bar.label}
          style={styles.row}
          accessibilityLabel={`${bar.label}, ${formatPercent(bar.value)}`}
        >
          <Typography variant="caption1" tone="secondary">
            {bar.label}
          </Typography>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                bar.value < 0 && styles.negative,
                { width: `${(Math.abs(bar.value) / max) * 100}%` as const },
              ]}
            />
          </View>
          <Typography variant="caption1">{formatPercent(bar.value)}</Typography>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { gap: theme.space.xs, marginVertical: theme.space.xs },
  track: { backgroundColor: theme.muted, height: 8, borderRadius: 4 },
  bar: { backgroundColor: theme.seriesCoupon, height: 8, borderRadius: 4 },
  negative: { backgroundColor: theme.seriesPurchase },
}));
