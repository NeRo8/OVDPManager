import { Fragment } from 'react';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { purchaseCurrency } from '@/entities/portfolio';
import { formatDate, formatMoney, round2 } from '@/shared/lib';
import { FAB_CLEARANCE, ScreenScrollView, Section, Separator, Typography } from '@/shared/ui';
import { useBondIsin } from '../model/useBondIsin.hook';
import { useBondDetails } from '../model/useBondDetails.hook';

/** The purchases that make up the position; each can be deleted on its own. */
export default function BondPurchasesScreen() {
  const isin = useBondIsin();
  const { position, bond, canTopUp, deletePurchase } = useBondDetails(isin);

  if (!position) return null;

  return (
    <ScreenScrollView contentContainerStyle={canTopUp && styles.withFab}>
      <Section>
        {position.purchases.map((purchase, index) => (
          <Fragment key={purchase.id}>
            {index > 0 && <Separator />}
            <View style={styles.purchase}>
              <View style={styles.purchaseInfo}>
                <Typography variant="callout" tabular>
                  {formatDate(purchase.purchaseDate)} · {purchase.quantity} шт
                </Typography>
                <Typography variant="caption1" tone="secondary">
                  {formatMoney(purchase.amount, purchaseCurrency(purchase, bond))} · по{' '}
                  {formatMoney(
                    round2(purchase.amount / purchase.quantity),
                    purchaseCurrency(purchase, bond),
                  )}
                </Typography>
              </View>
              <Pressable
                onPress={() => deletePurchase(purchase)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Видалити покупку від ${formatDate(purchase.purchaseDate)}`}
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
  purchase: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  purchaseInfo: { flex: 1, gap: 2 },
  pressed: { opacity: 0.5 },
});
