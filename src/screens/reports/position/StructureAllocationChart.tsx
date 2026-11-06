import { View } from 'react-native';

import { Canvas, Path } from '@shopify/react-native-skia';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

import { chartPalette } from '@/components/chart/chartTheme';
import { LegendRow } from '@/components/chart/LegendRow';
import { Card } from '@/components/layout/Card';
import { Typography } from '@/components/typography/Typography';
import { allocationSegments } from '@/screens/reports/shared/allocationSegments';
import type { ReportAllocationChart } from '@/screens/reports/shared/reportSection';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

type Props = { title: string; chart: ReportAllocationChart; footer?: string };

export function StructureAllocationChart({ title, chart, footer }: Props) {
  const { theme } = useUnistyles();
  const palette = chartPalette(theme);
  const total = chart.slices.reduce((sum, slice) => sum + slice.value, 0);
  const slices = allocationSegments(chart);
  return (
    <Card title={title} footer={footer}>
      <View
        style={styles.ring}
        accessible
        accessibilityLabel={`Розподіл собівартості за облігаціями, ${formatMoney(total, chart.currency)}. Значення кожної частки наведено нижче.`}
      >
        <Canvas style={styles.canvas}>
          {slices.map((slice) => (
            <Path
              key={slice.label}
              path={slice.path}
              style="stroke"
              strokeWidth={24}
              color={palette.marks[slice.color]}
            />
          ))}
        </Canvas>
        <View style={styles.center}>
          <Typography variant="caption1" tone="secondary" align="center">
            Собівартість
          </Typography>
          <Typography variant="footnote" weight="semibold" align="center" tabular>
            {formatMoney(total, chart.currency)}
          </Typography>
        </View>
      </View>
      {slices.map((slice) => (
        <LegendRow
          key={slice.label}
          color={slice.color}
          label={slice.label}
          value={`${formatMoney(slice.value, chart.currency)} · ${formatPercent(round2((slice.value / total) * 100))}`}
        />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  ring: { width: 180, height: 180, alignSelf: 'center' },
  canvas: { width: 180, height: 180 },
  center: {
    position: 'absolute',
    top: 45,
    bottom: 45,
    left: 30,
    right: 30,
    justifyContent: 'center',
  },
});
