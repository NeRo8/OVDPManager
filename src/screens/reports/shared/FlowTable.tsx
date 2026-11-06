import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { Card } from '@/components/layout/Card';
import { Typography } from '@/components/typography/Typography';
import type { ReportTable } from '@/screens/reports/shared/reportSection';

type Props = { title: string; table: ReportTable };

export function FlowTable({ title, table }: Props) {
  return (
    <Card title={title}>
      <View style={styles.row}>
        <View style={[styles.month, table.firstColumn === 'Міс' && styles.shortMonth]}>
          <Typography variant="caption1" weight="semibold">
            {table.firstColumn ?? 'Міс'}
          </Typography>
        </View>
        {table.columns.map((column) => (
          <View key={column} style={styles.cell}>
            <Typography
              variant="caption1"
              weight="semibold"
              align="right"
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {column}
            </Typography>
          </View>
        ))}
      </View>
      {table.rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <View style={[styles.month, table.firstColumn === 'Міс' && styles.shortMonth]}>
            <Typography variant="caption1" tone="secondary">
              {row.label}
            </Typography>
          </View>
          {row.values.map((value, index) => (
            <View key={table.columns[index]} style={styles.cell}>
              <Typography
                variant="caption1"
                tabular
                align="right"
                accessibilityLabel={`${row.label}, ${table.columns[index]}: ${value} ${table.currency ?? ''}`}
              >
                {value}
              </Typography>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  month: { width: 65 },
  shortMonth: { width: 38 },
  cell: { flex: 1, paddingLeft: theme.space.xs },
}));
