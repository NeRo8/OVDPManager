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
import { currencySign, formatDate, formatMoney, plural } from '@/shared/lib';
import { NbuSourceNote, StaleBondsNotice, WalletGate, useWallet } from '@/entities/portfolio';
import { NextPaymentLine } from './NextPaymentLine';

export default function PortfolioScreen() {
  const wallet = useWallet();
  const { isFetching, error, refresh, positions } = wallet;

  return (
    <WalletGate wallet={wallet}>
      <View style={styles.screen}>
        <FlatList
          style={styles.list}
          contentContainerStyle={[screenContent, styles.listContent]}
          contentInsetAdjustmentBehavior="automatic"
          data={positions}
          keyExtractor={({ position }) => position.isin}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refresh} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <StaleBondsNotice error={error} />
              <SectionTitle title="Мої ОВДП" />
            </View>
          }
          renderItem={({ item: { position, bond, currency, next }, index }) => (
            <SectionCell index={index} count={positions.length}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/bond/[isin]', params: { isin: position.isin } })
                }
                accessibilityRole="link"
                style={({ pressed }) => [styles.holding, pressed && styles.pressed]}
              >
                {/* Money invested: the purchase color of the schedule chart. */}
                <Avatar label={currency ? currencySign(currency) : '?'} color="purchase" />
                <View style={styles.holdingInfo}>
                  <View style={styles.holdingTop}>
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
                    {position.quantity} шт · {formatMoney(position.amount, currency)} ·{' '}
                    {position.lots.length === 1
                      ? `куплено ${formatDate(position.lots[0].purchaseDate)}`
                      : `${position.lots.length} ${plural(position.lots.length, 'покупка', 'покупки', 'покупок')}`}
                  </Typography>
                  <NextPaymentLine next={next} hasBond={!!bond} />
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
  listHeader: { gap: 24, marginBottom: 6 },
  holding: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  holdingInfo: { flex: 1, gap: 4 },
  pressed: { backgroundColor: theme.muted },
  holdingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
}));
