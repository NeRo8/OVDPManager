import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { Card, ColumnChart, SectionTitle, Typography } from '@/shared/ui';
import type { CurrencyYield } from '../model/yieldReport';

type Props = { report: CurrencyYield };

/** Known annual yields on a shared percentage scale; losses extend left of zero. */
export function YieldBondChart({ report }: Props) {
  const known = report.bonds.filter(
    (bond): bond is typeof bond & { annualYield: number } => bond.annualYield !== null,
  );
  if (!known.length) return null;
  const shown = known.slice(0, 5);

  return (
    <View style={styles.section}>
      <SectionTitle title={`Дохідність за ОВДП · ${CURRENCY_NAMES[report.currency]}`} />
      <Card>
        <ColumnChart
          orientation="horizontal"
          valueFormat="percent"
          columns={shown.map(({ isin }) => ({ label: isin, name: `ОВДП ${isin}` }))}
          series={[
            {
              label: 'річна дохідність',
              color: 'coupon',
              values: shown.map(({ annualYield }) => Math.max(0, annualYield)),
            },
            {
              label: 'від’ємна річна дохідність',
              color: 'purchase',
              direction: 'down',
              values: shown.map(({ annualYield }) => Math.max(0, -annualYield)),
            },
          ]}
          currency={report.currency}
        />
      </Card>
      {known.length > shown.length && (
        <Typography variant="caption1" tone="secondary" style={styles.note}>
          Показано 5 ОВДП із найвищою дохідністю; усі значення наведено нижче.
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  note: { marginHorizontal: theme.space.lg },
}));
