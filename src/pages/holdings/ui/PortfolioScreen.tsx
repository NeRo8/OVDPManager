import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import {
  Avatar,
  FAB_CLEARANCE,
  FloatingActionButton,
  SectionCell,
  SectionTitle,
  Typography,
  screenContent,
} from '@/shared/ui';
import { currencySign, formatDate, formatMoney, plural, usePullToRefresh } from '@/shared/lib';
import { NbuSourceNote, StaleBondsNotice, WalletGate, useWallet } from '@/entities/portfolio';
import { NextPaymentLine } from './NextPaymentLine';

/** When the bonds were bought, or how many purchases there are, with the planned ones named. */
function purchaseSummary(purchases: { purchaseDate: string }[], today: string): string {
  if (purchases.length === 1) {
    const [{ purchaseDate }] = purchases;
    return purchaseDate > today
      ? `заплановано на ${formatDate(purchaseDate)}`
      : `куплено ${formatDate(purchaseDate)}`;
  }
  const planned = purchases.filter((purchase) => purchase.purchaseDate > today).length;
  const count = `${purchases.length} ${plural(purchases.length, 'покупка', 'покупки', 'покупок')}`;
  return planned ? `${count}, ${planned} заплановано` : count;
}

export default function PortfolioScreen() {
  const wallet = useWallet();
  const { error, refresh, positions, today } = wallet;
  const pullToRefresh = usePullToRefresh(refresh);

  return (
    <WalletGate wallet={wallet}>
      <View style={styles.screen}>
        <FlatList
          style={styles.list}
          contentContainerStyle={[screenContent, styles.listContent]}
          contentInsetAdjustmentBehavior="automatic"
          data={positions}
          keyExtractor={({ position }) => position.isin}
          refreshControl={<RefreshControl {...pullToRefresh} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <StaleBondsNotice error={error} />
              <SectionTitle title="Мої ОВДП" />
            </View>
          }
          renderItem={({ item: { position, bond, currency, nextPayment }, index }) => (
            <SectionCell index={index} count={positions.length}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
                }
                accessibilityRole="link"
                style={({ pressed }) => [styles.position, pressed && styles.pressed]}
              >
                {/* Money invested: the purchase color of the schedule chart. */}
                <Avatar label={currency ? currencySign(currency) : '?'} color="purchase" />
                <View style={styles.positionInfo}>
                  <View style={styles.positionTop}>
                    <Typography variant="headline" tabular>
                      {position.isin}
                    </Typography>
                    {bond && (
                      <Typography variant="caption1" tone="secondary">
                        {bond.rate}% · до {formatDate(bond.maturityDate)}
                      </Typography>
                    )}
                  </View>
                  <Typography variant="caption1" tone="secondary">
                    {position.quantity} шт · {formatMoney(position.investedAmount, currency)} ·{' '}
                    {purchaseSummary(position.purchases, today)}
                  </Typography>
                  <NextPaymentLine nextPayment={nextPayment} hasBond={!!bond} />
                </View>
              </Pressable>
            </SectionCell>
          )}
          ListFooterComponent={<NbuSourceNote />}
        />
        <FloatingActionButton
          accessibilityLabel="Додати ОВДП"
          onPress={() => router.push('/add')}
        />
      </View>
    </WalletGate>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1 },
  list: { backgroundColor: theme.background },
  listContent: { gap: 0, paddingBottom: FAB_CLEARANCE },
  listHeader: { gap: theme.space.xl, marginBottom: theme.space.sm },
  position: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  positionInfo: { flex: 1, gap: theme.space.xs },
  pressed: { backgroundColor: theme.muted },
  positionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.space.md,
  },
}));
