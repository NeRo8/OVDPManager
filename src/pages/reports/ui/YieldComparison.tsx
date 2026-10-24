import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES, type Currency } from '@/entities/portfolio';
import { Card, SectionTitle, ShareBar, Typography } from '@/shared/ui';

type Props = {
  currency: Currency;
  averageYield: number;
  keyRate: number;
};

/** The portfolio's yield and the key rate as two bars on one scale. */
export function YieldComparison({ currency, averageYield, keyRate }: Props) {
  const largest = Math.max(averageYield, keyRate);
  const bars = [
    { label: 'Портфель', value: averageYield },
    { label: 'Облікова ставка НБУ', value: keyRate },
  ];

  return (
    <View style={styles.section}>
      <SectionTitle title={`Поруч з обліковою ставкою · ${CURRENCY_NAMES[currency]}`} />
      <Card>
        <View style={styles.bars}>
          {bars.map(({ label, value }) => (
            <View key={label} style={styles.bar}>
              <View style={styles.row}>
                <Typography variant="footnote" tone="secondary">
                  {label}
                </Typography>
                <Typography variant="footnote" weight="semibold" tabular>
                  {value}%
                </Typography>
              </View>
              <ShareBar
                percent={largest > 0 ? (Math.max(value, 0) / largest) * 100 : 0}
                accessibilityLabel={`${label}: ${value}%`}
              />
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  bars: { gap: theme.space.md },
  bar: { gap: theme.space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md },
}));
