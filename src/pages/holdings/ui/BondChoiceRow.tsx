import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type Bond, canBuyOn, isRedeemed } from '@/entities/portfolio';
import { formatDate, formatTimeLeft } from '@/shared/lib';
import { ThemedIcon, Typography } from '@/shared/ui';

type BondChoiceRowProps = {
  bond: Bond;
  today: string;
  /** Quantity already in the wallet */
  owned?: number;
  /** Search results mix currencies; the filtered list is all in one */
  showCurrency: boolean;
  onPress: () => void;
};

/** A bond to choose: what it pays on the right, when it matures and what is owned on the left. */
export function BondChoiceRow({ bond, today, owned, showCurrency, onPress }: BondChoiceRowProps) {
  const isActive = canBuyOn(bond, today);
  const details = [
    showCurrency && bond.currency,
    isActive
      ? `до ${formatDate(bond.maturityDate)} · ${formatTimeLeft(today, bond.maturityDate)}`
      : isRedeemed(bond, today)
        ? `погашена ${formatDate(bond.maturityDate)}`
        : 'погашається сьогодні',
    owned && `у гаманці ${owned} шт`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${bond.isin}, ${bond.rate}% річних, ${details}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.rowText}>
        <Typography variant="body" tabular>
          {bond.isin}
        </Typography>
        <Typography variant="caption1" tone="secondary">
          {details}
        </Typography>
      </View>
      <Typography variant="headline" tabular tone={isActive ? 'primary' : 'secondary'}>
        {bond.rate}%
      </Typography>
      <ThemedIcon
        name="chevron-forward"
        size={16}
        uniProps={(theme) => ({ color: theme.secondaryText })}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 56,
  },
  rowText: { flex: 1, gap: theme.space.xxs },
  pressed: { backgroundColor: theme.muted },
}));
