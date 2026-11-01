import { View } from 'react-native';

import { StyleSheet } from 'react-native-unistyles';

import { formatDate } from '@/shared/lib';
import { Money, Percent, Typography } from '@/shared/ui';

import type { Bond } from '../model/portfolio';

type Props = {
  bond: Bond;
};

/** The issue's terms as a compact grid, for the head of the bond screen. */
export function BondTerms({ bond }: Props) {
  const coupon = bond.payments.find((payment) => payment.type === 'coupon');
  const terms = [
    { label: 'Ставка купону', value: <Percent value={bond.rate} /> },
    {
      label: 'Перший купон на 1 шт',
      value: coupon ? (
        <>
          <Money value={coupon.amount} currency={bond.currency} /> · {formatDate(coupon.date)}
        </>
      ) : (
        'немає даних'
      ),
    },
    { label: 'Номінал', value: <Money value={bond.nominal} currency={bond.currency} /> },
    { label: 'Тип', value: bond.description },
    { label: 'Дата розміщення', value: formatDate(bond.issueDate) },
    { label: 'Дата погашення', value: formatDate(bond.maturityDate) },
  ];

  return (
    <View style={styles.grid} accessibilityLabel="Параметри випуску">
      {terms.map((term) => (
        <View key={term.label} style={styles.term}>
          <Typography variant="caption2" tone="secondary">
            {term.label}
          </Typography>
          {/* Half a card width: an unusually long type shrinks to fit. */}
          <Typography
            variant="footnote"
            weight="semibold"
            tabular
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {term.value}
          </Typography>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.space.md },
  term: { width: '50%', gap: theme.space.xxs, paddingRight: theme.space.sm },
}));
