import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { CURRENCY_NAMES } from '@/entities/portfolio';
import { formatMoney } from '@/shared/lib';
import { Card, SectionTitle, ShareBar, Typography } from '@/shared/ui';
import type { CurrencyStructure } from '../model/structureReport';
import { shareCell } from './reportCells';
import { TERM_BUCKET_LABELS } from './structureLabels';

type Props = {
  report: CurrencyStructure;
};

/** How one currency's money splits by time left to maturity; empty spans show too. */
export function StructureTerms({ report }: Props) {
  const { currency, terms } = report;

  return (
    <View style={styles.section}>
      <SectionTitle title={`За строком до погашення · ${CURRENCY_NAMES[currency]}`} />
      <Card>
        <View style={styles.terms}>
          {terms.map(({ term, amount, share, count }) => (
            <View key={term} style={styles.term}>
              <View style={styles.row}>
                <Typography variant="footnote" tone="secondary">
                  {TERM_BUCKET_LABELS[term]}
                  {count > 0 && ` · ОВДП: ${count}`}
                </Typography>
                <Typography variant="footnote" weight="semibold" tabular>
                  {amount > 0 ? `${formatMoney(amount, currency)} · ${shareCell(share)}` : '—'}
                </Typography>
              </View>
              <ShareBar percent={share} accessibilityLabel={TERM_BUCKET_LABELS[term]} />
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: { gap: theme.space.sm },
  terms: { gap: theme.space.md },
  term: { gap: theme.space.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md },
}));
