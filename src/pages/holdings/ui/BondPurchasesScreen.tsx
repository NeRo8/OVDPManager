import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { formatDate, formatMoney, round2 } from '@/shared/lib';
import { FAB_CLEARANCE, ScreenScrollView, Section, Separator, Typography } from '@/shared/ui';
import { useBondIsin } from '../model/useBondIsin.hook';
import { useBondDetails } from '../model/useBondDetails.hook';

/** The purchases that make up the position; each can be deleted on its own. */
export default function BondPurchasesScreen() {
  const isin = useBondIsin();
  const { position, currency, canTopUp, deleteLot } = useBondDetails(isin);

  if (!position) return null;

  return (
    <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
      <Section>
        {position.lots.map((lot, index) => (
          <Fragment key={lot.id}>
            {index > 0 && <Separator />}
            <View style={styles.lot}>
              <View style={styles.lotInfo}>
                <Typography variant="callout" tabular>
                  {formatDate(lot.purchaseDate)} · {lot.quantity} шт
                </Typography>
                <Typography variant="caption1" tone="secondary">
                  {formatMoney(lot.amount, currency)} · по{' '}
                  {formatMoney(round2(lot.amount / lot.quantity), currency)}
                </Typography>
              </View>
              <Pressable
                onPress={() => deleteLot(lot)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Видалити покупку від ${formatDate(lot.purchaseDate)}`}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Typography variant="subhead" tone="danger">
                  Видалити
                </Typography>
              </Pressable>
            </View>
          </Fragment>
        ))}
      </Section>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  withFab: { paddingBottom: FAB_CLEARANCE },
  lot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lotInfo: { flex: 1, gap: 2 },
  pressed: { opacity: 0.5 },
});
