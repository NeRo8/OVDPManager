import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatDate, formatMoney } from '@/shared/lib';
import { Typography } from '@/shared/ui';
import type { Bond } from '../model/portfolio';

type Props = {
  bond: Bond;
};

/** The issue's terms as a compact grid, for the head of the bond screen. */
export function BondTerms({ bond }: Props) {
  const coupon = bond.payments.find((payment) => payment.type === 'coupon');
  const terms = [
    { label: 'Ставка', value: `${bond.rate}%` },
    {
      label: 'Купон на 1 шт',
      value: coupon ? formatMoney(coupon.amount, bond.currency) : 'без купону',
    },
    { label: 'Номінал', value: formatMoney(bond.nominal, bond.currency) },
    { label: 'Розміщення', value: formatDate(bond.issueDate) },
    { label: 'Погашення', value: formatDate(bond.maturityDate) },
    { label: 'Тип', value: bond.description },
  ];

  return (
    <View style={styles.grid} accessibilityLabel="Параметри випуску">
      {terms.map((term) => (
        <View key={term.label} style={styles.term}>
          <Typography variant="caption2" tone="secondary">
            {term.label}
          </Typography>
          {/* A third of a phone width: a long type such as «Середньострокові» shrinks to fit. */}
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

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  term: { width: '33.33%', gap: 2, paddingRight: 8 },
});
